import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { Platform } from "@/sdk/Platform";
import { RewardProcessor } from "@/purchase/RewardProcessor";
import type { RewardDefinition } from "@/purchase/types";
import { DAILY_GIFT_CYCLE_LENGTH, getDailyGiftRewards } from "@/configs/dailyGift";
import { useProgressStore } from "@/store/progressStore";

const STORAGE_KEY = "dailyGiftV1";

export type DailyGiftState = {
  version: 1;
  lastClaimedUtcDay?: string;
  lastClaimedDay?: number;
  cycleNumber: number;
  totalClaims: number;
};

const defaultState = (): DailyGiftState => ({ version: 1, cycleNumber: 1, totalClaims: 0 });

function getUtcDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function getUtcDayDifference(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export const useDailyGiftStore = defineStore("dailyGiftStore", () => {
  const platform = Platform.getInstance();
  const progressStore = useProgressStore();
  const state = ref<DailyGiftState>(defaultState());
  const currentUtcDay = ref(getUtcDay());
  const isReady = ref(false);
  const isClaiming = ref(false);
  const error = ref<string | null>(null);

  const status = computed(() => {
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
    getDailyGiftRewards(status.value.day, status.value.cycleNumber),
  );

  function refreshStatus() {
    currentUtcDay.value = getUtcDay();
  }

  async function persist() {
    await platform.setPlayerDataByKey(STORAGE_KEY, JSON.stringify(state.value));
  }

  async function restore() {
    try {
      const raw = await platform.getPlayerDataByKey(STORAGE_KEY);
      if (raw != null) {
        const parsed = JSON.parse(String(raw));
        if (parsed && parsed.version === 1) {
          state.value = {
            ...defaultState(), ...parsed,
            cycleNumber: Math.max(1, Number(parsed.cycleNumber) || 1),
            totalClaims: Math.max(0, Number(parsed.totalClaims) || 0),
          };
        }
      }
      refreshStatus();
    } catch (err) {
      console.error("[DailyGiftStore] restore error:", err);
      error.value = "restore_failed";
    } finally {
      isReady.value = true;
    }
  }

  async function claim(): Promise<boolean> {
    refreshStatus();
    if (!status.value.canClaim || isClaiming.value) return false;

    isClaiming.value = true;
    error.value = null;
    const claimStatus = status.value;
    try {
      await RewardProcessor.applyAll(currentRewards.value);
      state.value = {
        ...state.value,
        lastClaimedUtcDay: currentUtcDay.value,
        lastClaimedDay: claimStatus.day,
        cycleNumber: claimStatus.cycleNumber,
        totalClaims: state.value.totalClaims + 1,
      };
      await progressStore.saveProgress();
      await persist();
      return true;
    } catch (err) {
      console.error("[DailyGiftStore] claim error:", err);
      error.value = "claim_failed";
      return false;
    } finally {
      isClaiming.value = false;
    }
  }

  return { state, status, currentRewards, isReady, isClaiming, error, refreshStatus, restore, claim };
});
