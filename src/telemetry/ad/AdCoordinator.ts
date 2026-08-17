import { adsConfig } from "@/configs/ads";
import { SoundManager } from "@/game/sound/SoundManager";
import { PlatformAds } from "@/sdk/PlatformAds";
import { EffectService } from "@/purchase/services/EffectService";
import { Telemetry } from "../Telemetry";
import type { AdPlacement, EventEnvelope } from "../events";
import { AdPolicy } from "./AdPolicy";

export type RewardedRequest = {
  placement: Exclude<AdPlacement, "gameover_interstitial" | "sticky_banner">;
  rewardId: string;
  grantReward: () => void | Promise<void>;
};

export type RewardedAdResult = {
  status: "closed" | "failed";
  rewarded: boolean;
  reason?: string;
};

export class AdCoordinator {
  private static instance: AdCoordinator | null = null;
  private readonly policy = new AdPolicy();
  private isShowing = false;
  private isStickyBannerVisible = false;

  static getInstance(): AdCoordinator {
    if (!this.instance) this.instance = new AdCoordinator();
    return this.instance;
  }

  constructor() {
    Telemetry.subscribe((event) => this.consume(event));
  }

  private consume(event: EventEnvelope): void {
    if (event.type === "app.ready" && adsConfig.stickyBanner.showOn === "app_ready") {
      void this.showStickyBanner();
      return;
    }

    if (event.type === "economy.purchase_completed" && this.isAdsDisabled()) {
      this.hideStickyBanner();
      return;
    }

    if (event.type !== "run.finished" || event.reason !== "crash") return;
    if (this.isAdsDisabled()) {
      Telemetry.emit({
        type: "ad.suppressed",
        placement: adsConfig.interstitial.placement,
        format: "interstitial",
        reason: "ads_disabled_by_purchase",
      });
      return;
    }
    this.policy.recordCompletedRun();
    if (!this.policy.canShowInterstitial()) {
      Telemetry.emit({
        type: "ad.suppressed",
        placement: adsConfig.interstitial.placement,
        format: "interstitial",
        reason: "policy",
      });
      return;
    }
    if (this.isShowing) {
      Telemetry.emit({
        type: "ad.suppressed",
        placement: adsConfig.interstitial.placement,
        format: "interstitial",
        reason: "ad_already_showing",
      });
      return;
    }
    void this.showInterstitial();
  }

  private async showInterstitial(): Promise<void> {
    if (this.isShowing) return;
    this.isShowing = true;

    const { placement } = adsConfig.interstitial;
    let opened = false;
    let suspendPromise: Promise<void> | undefined;
    Telemetry.emit({ type: "ad.requested", placement, format: "interstitial" });

    const result = await PlatformAds.showInterstitial(() => {
      opened = true;
      this.policy.recordInterstitialShown();
      Telemetry.emit({ type: "ad.opened", placement, format: "interstitial" });
      suspendPromise = SoundManager.getInstance().suspend().catch((error) => {
        if (import.meta.env.DEV) console.warn("[ads] failed to suspend audio", error);
      });
    });

    if (suspendPromise) await suspendPromise;
    if (opened) {
      await SoundManager.getInstance().resume().catch((error) => {
        if (import.meta.env.DEV) console.warn("[ads] failed to resume audio", error);
      });
    }

    if (result.status === "closed") {
      Telemetry.emit({ type: "ad.closed", placement, format: "interstitial" });
    } else {
      Telemetry.emit({
        type: "ad.failed",
        placement,
        format: "interstitial",
        reason: result.reason,
      });
    }
    this.isShowing = false;
  }

  private async showStickyBanner(): Promise<void> {
    const { placement } = adsConfig.stickyBanner;
    if (this.isAdsDisabled()) {
      Telemetry.emit({
        type: "ad.suppressed",
        placement,
        format: "sticky_banner",
        reason: "ads_disabled_by_purchase",
      });
      return;
    }
    if (!this.policy.canShowStickyBanner()) {
      Telemetry.emit({
        type: "ad.suppressed",
        placement,
        format: "sticky_banner",
        reason: "policy",
      });
      return;
    }
    if (this.isStickyBannerVisible || PlatformAds.getStickyBannerStatus() === "shown") {
      this.isStickyBannerVisible = true;
      return;
    }

    Telemetry.emit({ type: "ad.requested", placement, format: "sticky_banner" });
    const result = PlatformAds.showStickyBanner();
    if (result.status === "shown") {
      this.isStickyBannerVisible = true;
      Telemetry.emit({ type: "ad.opened", placement, format: "sticky_banner" });
      return;
    }

    Telemetry.emit({
      type: "ad.failed",
      placement,
      format: "sticky_banner",
      reason: result.reason,
    });
  }

  private hideStickyBanner(): void {
    const { placement } = adsConfig.stickyBanner;
    if (!this.isStickyBannerVisible && PlatformAds.getStickyBannerStatus() !== "shown") return;

    const result = PlatformAds.hideStickyBanner();
    if (result.status === "closed") {
      this.isStickyBannerVisible = false;
      Telemetry.emit({ type: "ad.closed", placement, format: "sticky_banner" });
      return;
    }

    Telemetry.emit({
      type: "ad.failed",
      placement,
      format: "sticky_banner",
      reason: result.reason,
    });
  }

  async requestRewarded(request: RewardedRequest): Promise<RewardedAdResult> {
    if (this.isAdsDisabled()) {
      Telemetry.emit({
        type: "ad.suppressed",
        placement: request.placement,
        format: "rewarded",
        reason: "ads_disabled_by_purchase",
      });
      return { status: "failed", rewarded: false, reason: "ads_disabled_by_purchase" };
    }
    if (this.isShowing) {
      Telemetry.emit({
        type: "ad.suppressed",
        placement: request.placement,
        format: "rewarded",
        reason: "ad_already_showing",
      });
      return { status: "failed", rewarded: false, reason: "ad_already_showing" };
    }

    this.isShowing = true;
    let opened = false;
    let rewarded = false;
    let suspendPromise: Promise<void> | undefined;
    let rewardPromise: Promise<void> | undefined;
    Telemetry.emit({
      type: "ad.requested",
      placement: request.placement,
      format: "rewarded",
    });

    const result = await PlatformAds.showRewarded(
      () => {
        opened = true;
        Telemetry.emit({
          type: "ad.opened",
          placement: request.placement,
          format: "rewarded",
        });
        suspendPromise = SoundManager.getInstance().suspend().catch((error) => {
          if (import.meta.env.DEV) console.warn("[ads] failed to suspend audio", error);
        });
      },
      () => {
        if (rewardPromise) return;
        rewardPromise = Promise.resolve(request.grantReward())
          .then(() => {
            rewarded = true;
            Telemetry.emit({
              type: "ad.rewarded",
              placement: request.placement,
              rewardId: request.rewardId,
            });
          })
          .catch((error) => {
            if (import.meta.env.DEV) console.warn("[ads] reward grant failed", error);
          });
      },
    );

    if (rewardPromise) await rewardPromise;
    if (suspendPromise) await suspendPromise;
    if (opened) {
      await SoundManager.getInstance().resume().catch((error) => {
        if (import.meta.env.DEV) console.warn("[ads] failed to resume audio", error);
      });
    }

    if (result.status === "closed") {
      Telemetry.emit({ type: "ad.closed", placement: request.placement, format: "rewarded" });
    } else {
      Telemetry.emit({
        type: "ad.failed",
        placement: request.placement,
        format: "rewarded",
        reason: result.reason,
      });
    }
    this.isShowing = false;
    return { ...result, rewarded };
  }

  private isAdsDisabled(): boolean {
    return EffectService.isFeatureActive("adOff");
  }
}
