import { adsConfig } from "@/configs/ads";

const STORAGE_KEY = "ads.interstitialPolicy.v1";

type AdPolicyState = {
  completedRunsSinceInterstitial: number;
  lastInterstitialAt: number | null;
};

function restoreState(): AdPolicyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw ? JSON.parse(raw) : null;
    return {
      completedRunsSinceInterstitial: Math.max(0, Number(value?.completedRunsSinceInterstitial) || 0),
      lastInterstitialAt: typeof value?.lastInterstitialAt === "number" ? value.lastInterstitialAt : null,
    };
  } catch {
    return { completedRunsSinceInterstitial: 0, lastInterstitialAt: null };
  }
}

export class AdPolicy {
  private state = restoreState();

  recordCompletedRun(): void {
    this.state.completedRunsSinceInterstitial += 1;
    this.persist();
  }

  canShowInterstitial(now = Date.now()): boolean {
    const config = adsConfig.interstitial;
    if (!config.enabled) return false;
    if (this.state.completedRunsSinceInterstitial < config.minCompletedRuns) return false;
    if (
      this.state.lastInterstitialAt !== null &&
      now - this.state.lastInterstitialAt < config.minIntervalMs
    ) {
      return false;
    }
    return true;
  }

  canShowStickyBanner(): boolean {
    return adsConfig.stickyBanner.enabled;
  }

  recordInterstitialShown(now = Date.now()): void {
    this.state.completedRunsSinceInterstitial = 0;
    this.state.lastInterstitialAt = now;
    this.persist();
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }
}
