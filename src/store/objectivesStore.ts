import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { Platform } from "@/sdk/Platform";
import { RewardProcessor } from "@/purchase/RewardProcessor";
import { useProgressStore } from "@/store/progressStore";
import {
  ACHIEVEMENTS,
  DAILY_OBJECTIVES,
  type ObjectiveDefinition,
  type ObjectiveEvent,
} from "@/configs/objectives";

const STORAGE_KEY = "objectivesV1";

type ObjectiveProgress = Record<string, number>;
type ObjectivesState = {
  version: 1;
  dailyUtcDay: string;
  dailyProgress: ObjectiveProgress;
  dailyClaimed: string[];
  achievementProgress: ObjectiveProgress;
  achievementClaimed: string[];
};

function getUtcDay() {
  return new Date().toISOString().slice(0, 10);
}

function defaultState(): ObjectivesState {
  return {
    version: 1,
    dailyUtcDay: getUtcDay(),
    dailyProgress: {},
    dailyClaimed: [],
    achievementProgress: {},
    achievementClaimed: [],
  };
}

function sanitizeProgress(value: unknown): ObjectiveProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([id, progress]) => [id, Math.max(0, Number(progress) || 0)]),
  );
}

function sanitizeIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
}

export const useObjectivesStore = defineStore("objectivesStore", () => {
  const platform = Platform.getInstance();
  const state = ref<ObjectivesState>(defaultState());
  const isReady = ref(false);
  const isClaiming = ref<string | null>(null);
  const error = ref<string | null>(null);

  const dailyObjectives = computed(() => DAILY_OBJECTIVES);
  const achievements = computed(() => ACHIEVEMENTS);
  const hasClaimableDaily = computed(() => DAILY_OBJECTIVES.some((objective) => isClaimable(objective, true)));
  const hasClaimableAchievement = computed(() => ACHIEVEMENTS.some((objective) => isClaimable(objective, false)));
  const hasClaimable = computed(() => hasClaimableDaily.value || hasClaimableAchievement.value);

  function refreshDailyState() {
    const today = getUtcDay();
    if (state.value.dailyUtcDay === today) return;
    state.value.dailyUtcDay = today;
    state.value.dailyProgress = {};
    state.value.dailyClaimed = [];
  }

  function getProgress(objective: ObjectiveDefinition, isDaily: boolean): number {
    refreshDailyState();
    const progress = isDaily ? state.value.dailyProgress : state.value.achievementProgress;
    return Math.min(objective.target, progress[objective.id] ?? 0);
  }

  function isClaimed(objective: ObjectiveDefinition, isDaily: boolean): boolean {
    refreshDailyState();
    return (isDaily ? state.value.dailyClaimed : state.value.achievementClaimed).includes(objective.id);
  }

  function isClaimable(objective: ObjectiveDefinition, isDaily: boolean): boolean {
    return getProgress(objective, isDaily) >= objective.target && !isClaimed(objective, isDaily);
  }

  function track(event: ObjectiveEvent, amount = 1) {
    if (!isReady.value || amount <= 0) return;
    refreshDailyState();
    const increment = Number.isFinite(amount) ? amount : 0;
    if (increment <= 0) return;

    for (const objective of DAILY_OBJECTIVES) {
      if (objective.event === event && !isClaimed(objective, true)) {
        state.value.dailyProgress[objective.id] = Math.min(
          objective.target,
          (state.value.dailyProgress[objective.id] ?? 0) + increment,
        );
      }
    }
    for (const objective of ACHIEVEMENTS) {
      if (objective.event === event && !isClaimed(objective, false)) {
        state.value.achievementProgress[objective.id] = Math.min(
          objective.target,
          (state.value.achievementProgress[objective.id] ?? 0) + increment,
        );
      }
    }
  }

  async function persist() {
    await platform.setPlayerDataByKey(STORAGE_KEY, JSON.stringify(state.value));
  }

  async function restore() {
    try {
      const raw = await platform.getPlayerDataByKey(STORAGE_KEY);
      if (raw != null) {
        const parsed = JSON.parse(String(raw));
        if (parsed?.version === 1) {
          state.value = {
            ...defaultState(),
            dailyUtcDay: typeof parsed.dailyUtcDay === "string" ? parsed.dailyUtcDay : getUtcDay(),
            dailyProgress: sanitizeProgress(parsed.dailyProgress),
            dailyClaimed: sanitizeIds(parsed.dailyClaimed),
            achievementProgress: sanitizeProgress(parsed.achievementProgress),
            achievementClaimed: sanitizeIds(parsed.achievementClaimed),
          };
        }
      }
      refreshDailyState();
    } catch (cause) {
      console.error("[ObjectivesStore] restore error:", cause);
      error.value = "restore_failed";
    } finally {
      isReady.value = true;
    }
  }

  async function claim(objective: ObjectiveDefinition, isDaily: boolean): Promise<boolean> {
    refreshDailyState();
    if (!isClaimable(objective, isDaily) || isClaiming.value) return false;
    isClaiming.value = objective.id;
    error.value = null;
    try {
      await RewardProcessor.applyAll(objective.reward);
      if (isDaily) state.value.dailyClaimed.push(objective.id);
      else state.value.achievementClaimed.push(objective.id);
      await useProgressStore().saveProgress();
      await persist();
      return true;
    } catch (cause) {
      console.error("[ObjectivesStore] claim error:", cause);
      error.value = "claim_failed";
      return false;
    } finally {
      isClaiming.value = null;
    }
  }

  return {
    state,
    isReady,
    isClaiming,
    error,
    dailyObjectives,
    achievements,
    hasClaimableDaily,
    hasClaimableAchievement,
    hasClaimable,
    refreshDailyState,
    getProgress,
    isClaimed,
    isClaimable,
    track,
    persist,
    restore,
    claim,
  };
});
