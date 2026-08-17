import { Platform } from "./Platform";

export type PlatformAdResult =
  | { status: "closed" }
  | { status: "failed"; reason: string };

export type PlatformStickyBannerResult =
  | { status: "shown" }
  | { status: "failed"; reason: string };

function errorReason(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "unknown_error");
}

export class PlatformAds {
  private static readonly CALLBACK_TIMEOUT_MS = 45_000;

  static showInterstitial(onOpen?: () => void): Promise<PlatformAdResult> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: PlatformAdResult) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        resolve(result);
      };
      const timeoutId = window.setTimeout(
        () => finish({ status: "failed", reason: "callback_timeout" }),
        this.CALLBACK_TIMEOUT_MS,
      );

      try {
        Platform.getInstance().showFullscreenAd({
          onOpen,
          onClose: () => finish({ status: "closed" }),
          onError: (error) => finish({ status: "failed", reason: errorReason(error) }),
        });
      } catch (error) {
        finish({ status: "failed", reason: errorReason(error) });
      }
    });
  }

  static showRewarded(
    onOpen: (() => void) | undefined,
    onRewarded: () => void,
  ): Promise<PlatformAdResult> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: PlatformAdResult) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        resolve(result);
      };
      const timeoutId = window.setTimeout(
        () => finish({ status: "failed", reason: "callback_timeout" }),
        this.CALLBACK_TIMEOUT_MS,
      );

      try {
        Platform.getInstance().showRewardedVideoAd({
          onOpen,
          onRewarded,
          onClose: () => finish({ status: "closed" }),
          onError: (error) => finish({ status: "failed", reason: errorReason(error) }),
        });
      } catch (error) {
        finish({ status: "failed", reason: errorReason(error) });
      }
    });
  }

  static showStickyBanner(): PlatformStickyBannerResult {
    try {
      Platform.getInstance().showStickyBannerAd();
      return { status: "shown" };
    } catch (error) {
      return { status: "failed", reason: errorReason(error) };
    }
  }

  static hideStickyBanner(): PlatformAdResult {
    try {
      Platform.getInstance().hideStickyBannerAd();
      return { status: "closed" };
    } catch (error) {
      return { status: "failed", reason: errorReason(error) };
    }
  }

  static getStickyBannerStatus(): "shown" | "hidden" | "unknown" {
    try {
      return Platform.getInstance().getStickyBannerAdStatus();
    } catch {
      return "unknown";
    }
  }
}
