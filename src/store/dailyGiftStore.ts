import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { PlatformAds } from "@/sdk/PlatformAds";
import { Platform } from "@/sdk/Platform";
import { RewardProcessor } from "@/purchase/RewardProcessor";
import type { RewardDefinition } from "@/purchase/types";
import {
  DAILY_GIFT_CYCLE_LENGTH,
  DAILY_GIFT_RECOVERY,
  DAILY_GIFT_WEEK_LENGTH,
  getDailyGiftRewards,
  canDoubleDailyGift,
} from "@/configs/dailyGift";
import { useMetaStore } from "@/store/metaStore";
import { useProgressStore } from "@/store/progressStore";

const STORAGE_KEY = "dailyGiftV1";

export type DailyGiftState = {
  version: 1;
  lastClaimedUtcDay?: string;
  lastClaimedDay?: number;
  cycleNumber: number;
  totalClaims: number;
  recovered?: { day: number; utcDay: string; cycleNumber: number };
  pendingRecovery?: {
    day: number;
    utcDay: string;
    cycleNumber: number;
    balanceBefore: number;
    balanceAfter: number;
  };
};

const defaultState = (): DailyGiftState => ({
  version: 1,
  cycleNumber: 1,
  totalClaims: 0,
});

function getUtcDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function getUtcDayDifference(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}

export const useDailyGiftStore = defineStore("dailyGiftStore", () => {
  const platform = Platform.getInstance();
  const progressStore = useProgressStore();
  const meta = useMetaStore();
  const state = ref<DailyGiftState>(defaultState());
  const currentUtcDay = ref(getUtcDay());
  const isReady = ref(false);
  const isClaiming = ref(false);
  const isWatchingAd = ref(false);
  const isRecovering = ref(false);
  const error = ref<string | null>(null);

  const recovery = computed(() => {
    const saved = state.value;
    const lastDate = saved.recovered?.utcDay ?? saved.lastClaimedUtcDay;
    const difference = lastDate ? getUtcDayDifference(lastDate, currentUtcDay.value) : 0;
    const missedDays = Math.max(0, difference - (saved.recovered ? 0 : 1));
    const stoppedDay = saved.recovered?.day ?? saved.lastClaimedDay ?? 1;
    const day = Math.floor((stoppedDay - 1) / DAILY_GIFT_WEEK_LENGTH) * DAILY_GIFT_WEEK_LENGTH + 1;
    const config = DAILY_GIFT_RECOVERY;
    const available = config.enabled && Number.isSafeInteger(config.energonCost) && config.energonCost > 0
      && missedDays >= Math.max(1, config.minMissedDays) && missedDays <= config.maxMissedDays
      && day > 1 && day <= DAILY_GIFT_CYCLE_LENGTH;
    return { missedDays, day, week: Math.ceil(day / DAILY_GIFT_WEEK_LENGTH),
      cost: config.energonCost, available };
  });
  const canRecover = computed(() => isReady.value && !isClaiming.value && !isRecovering.value
    && (!!state.value.pendingRecovery || (recovery.value.available && meta.energons >= recovery.value.cost)));

  const status = computed(() => {
    if (state.value.recovered && state.value.recovered.utcDay === currentUtcDay.value) {
      return { day: state.value.recovered.day, cycleNumber: state.value.recovered.cycleNumber, canClaim: true };
    }
    if (state.value.recovered) return { day: 1, cycleNumber: state.value.recovered.cycleNumber, canClaim: true };
    const lastDay = state.value.lastClaimedDay;
    const lastDate = state.value.lastClaimedUtcDay;
    const cycleNumber = Math.max(1, state.value.cycleNumber);
    if (!lastDay || !lastDate) return { day: 1, cycleNumber, canClaim: true };

    const difference = getUtcDayDifference(lastDate, currentUtcDay.value);
    if (difference <= 0) return { day: lastDay, cycleNumber, canClaim: false };
    if (difference === 1) {
      return lastDay === DAILY_GIFT_CYCLE_LENGTH
        ? { day: 1, cycleNumber: cycleNumber + 1, canClaim: true }
        : { day: lastDay + 1, cycleNumber, canClaim: true };
    }
    return { day: 1, cycleNumber, canClaim: true };
  });

  const currentRewards = computed<RewardDefinition[]>(() =>
    getDailyGiftRewards(status.value.day),
  );

  const canDouble = computed(() => status.value.canClaim && canDoubleDailyGift(status.value.day));

  function getDisplayRewards(day: number): RewardDefinition[] {
    return getDailyGiftRewards(day).flatMap((reward) => {
      const resolved = RewardProcessor.resolve(reward);
      return resolved ? [resolved] : [];
    });
  }

  function refreshStatus() {
    currentUtcDay.value = getUtcDay();
  }

  async function persist(value = state.value) {
    await platform.setPlayerDataByKey(STORAGE_KEY, JSON.stringify(value));
  }

  async function restore() {
    try {
      const raw = await platform.getPlayerDataByKey(STORAGE_KEY);
      if (raw != null) {
        const parsed = JSON.parse(String(raw));
        if (parsed && parsed.version === 1) {
          state.value = {
            ...defaultState(),
            ...parsed,
            cycleNumber: Math.max(1, Number(parsed.cycleNumber) || 1),
            totalClaims: Math.max(0, Number(parsed.totalClaims) || 0),
          };
        }
      }
      refreshStatus();
      if (state.value.pendingRecovery) await recover();
    } catch (err) {
      console.error("[DailyGiftStore] restore error:", err);
      error.value = "restore_failed";
    } finally {
      isReady.value = true;
    }
  }

  async function recover(): Promise<boolean> {
    refreshStatus();
    if (isClaiming.value || isRecovering.value) return false;
    const pending = state.value.pendingRecovery;
    if (!pending && !canRecover.value) return false;
    isRecovering.value = true;
    error.value = null;
    try {
      const transaction = pending ?? {
        day: recovery.value.day,
        utcDay: currentUtcDay.value,
        cycleNumber: state.value.cycleNumber,
        balanceBefore: meta.energons,
        balanceAfter: meta.energons - recovery.value.cost,
      };
      if (!pending) {
        // Save the payment intent before debiting, so a reload can finish it safely.
        const nextState = { ...state.value, pendingRecovery: transaction };
        await persist(nextState);
        state.value = nextState;
      }
      const balance = await platform.getPlayerStatByKey("energons");
      if (balance === transaction.balanceBefore) {
        await platform.setPlayerStatByKey("energons", transaction.balanceAfter);
      } else if (balance !== transaction.balanceAfter) {
        throw new Error("Recovery balance changed; payment requires reconciliation");
      }
      meta.energons = transaction.balanceAfter;
      const nextState: DailyGiftState = {
        ...state.value,
        pendingRecovery: undefined,
        recovered: { day: transaction.day, utcDay: getUtcDay(), cycleNumber: transaction.cycleNumber },
      };
      await persist(nextState);
      state.value = nextState;
      return true;
    } catch (err) {
      console.error("[DailyGiftStore] recovery error:", err);
      error.value = "recovery_failed";
      return false;
    } finally {
      isRecovering.value = false;
    }
  }

  async function claim(doubleReward = false): Promise<boolean> {
    refreshStatus();
    if (!isReady.value || !status.value.canClaim || isClaiming.value || isRecovering.value || state.value.pendingRecovery) return false;

    if (doubleReward && !canDouble.value) return false;
    isClaiming.value = true;
    error.value = null;
    const claimStatus = { ...status.value };
    const claimDate = currentUtcDay.value;
    const rewards = currentRewards.value.map((reward) => doubleReward && reward.type === "currency"
      ? { ...reward, effect: { ...reward.effect, amount: reward.effect.amount * 2 } }
      : reward);
    try {
      if (doubleReward) {
        let rewarded = false;
        isWatchingAd.value = true;
        const result = await PlatformAds.showRewarded(undefined, () => {
          if (isWatchingAd.value) rewarded = true;
        });
        isWatchingAd.value = false;
        if (!rewarded) {
          error.value = result.status === "failed" ? "ad_failed" : "ad_not_completed";
          return false;
        }
      }
      await RewardProcessor.applyAll(rewards);
      state.value = {
        ...state.value,
        lastClaimedUtcDay: claimDate,
        lastClaimedDay: claimStatus.day,
        cycleNumber: claimStatus.cycleNumber,
        totalClaims: state.value.totalClaims + 1,
        recovered: undefined,
      };
      await progressStore.saveProgress();
      await persist();
      return true;
    } catch (err) {
      console.error("[DailyGiftStore] claim error:", err);
      error.value = "claim_failed";
      return false;
    } finally {
      isWatchingAd.value = false;
      isClaiming.value = false;
    }
  }

  return {
    state,
    status,
    currentRewards,
    getDisplayRewards,
    canDouble,
    isWatchingAd,
    recovery,
    canRecover,
    isRecovering,
    recover,
    isReady,
    isClaiming,
    error,
    refreshStatus,
    restore,
    claim,
  };
});
