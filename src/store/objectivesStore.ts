import { Telemetry } from "@/telemetry/Telemetry";
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { Platform } from "@/sdk/Platform";
import { RewardProcessor } from "@/purchase/RewardProcessor";
import { useProgressStore } from "@/store/progressStore";
import { useDailyGiftStore } from "@/store/dailyGiftStore";
import {
  ALL_ACHIEVEMENTS,
  getDailyObjectives,
  matchesRunConditions,
  type AchievementDefinition,
  type ObjectiveDefinition,
  type ObjectiveEvent,
  type ResolvedAchievement,
} from "@/configs/objectives";
import type { RunStats } from "@/telemetry/events";

const STORAGE_KEY = "objectivesV1";

type ObjectiveProgress = Record<string, number>;
type ObjectivesState = {
  version: 2;
  dailyUtcDay: string;
  dailyProgress: ObjectiveProgress;
  dailyClaimed: string[];
  achievementProgress: ObjectiveProgress;
  /** Number of already claimed levels in each achievement chain. */
  achievementLevels: ObjectiveProgress;
  /** The next run-achievement level that has passed its one-run conditions. */
  runAchievementReady: ObjectiveProgress;
};

type ObjectiveForDisplay = ObjectiveDefinition | ResolvedAchievement;

function getUtcDay() {
  return new Date().toISOString().slice(0, 10);
}

function defaultState(): ObjectivesState {
  return {
    version: 2,
    dailyUtcDay: getUtcDay(),
    dailyProgress: {},
    dailyClaimed: [],
    achievementProgress: {},
    achievementLevels: {},
    runAchievementReady: {},
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
  const dailyGift = useDailyGiftStore();
  const state = ref<ObjectivesState>(defaultState());
  const isReady = ref(false);
  const isClaiming = ref<string | null>(null);
  const error = ref<string | null>(null);

  const dailyObjectives = computed(() =>
    getDailyObjectives(dailyGift.status.day, dailyGift.status.cycleNumber),
  );
  const achievements = computed(() =>
    ALL_ACHIEVEMENTS.map((achievement) => resolveAchievement(achievement)),
  );
  const hasClaimableDaily = computed(() =>
    dailyObjectives.value.some((objective) => isClaimable(objective, true)),
  );
  const hasClaimableAchievement = computed(() =>
    achievements.value.some((objective) => isClaimable(objective, false)),
  );
  const hasClaimable = computed(() => hasClaimableDaily.value || hasClaimableAchievement.value);

  function refreshDailyState() {
    const today = getUtcDay();
    if (state.value.dailyUtcDay === today) return;
    state.value.dailyUtcDay = today;
    state.value.dailyProgress = {};
    state.value.dailyClaimed = [];
  }

  function getAchievementLevel(achievementId: string): number {
    return Math.max(0, Math.floor(state.value.achievementLevels[achievementId] ?? 0));
  }

  function resolveAchievement(achievement: AchievementDefinition): ResolvedAchievement {
    const level = getAchievementLevel(achievement.id);
    const lastLevel = achievement.levels.length - 1;
    const activeLevel = Math.min(level, lastLevel);
    const rewardLevel = achievement.levels[activeLevel];

    if (achievement.kind === "counter") {
      return {
        id: achievement.id,
        achievementId: achievement.id,
        kind: achievement.kind,
        level: activeLevel + 1,
        event: achievement.event,
        target: rewardLevel.target,
        reward: rewardLevel.reward,
      };
    }

    return {
      id: achievement.id,
      achievementId: achievement.id,
      kind: achievement.kind,
      level: activeLevel + 1,
      // Run achievements use 0/1 progress; the target is intentionally one.
      event: "game_finished",
      target: 1,
      reward: rewardLevel.reward,
      conditions: rewardLevel.conditions,
    };
  }

  function getProgress(objective: ObjectiveForDisplay, isDaily: boolean): number {
    refreshDailyState();
    if (isDaily) {
      return Math.min(objective.target, state.value.dailyProgress[objective.id] ?? 0);
    }

    const achievement = objective as ResolvedAchievement;
    if (achievement.kind === "run") {
      return state.value.runAchievementReady[achievement.achievementId] > getAchievementLevel(achievement.achievementId)
        ? 1
        : 0;
    }
    return Math.min(objective.target, state.value.achievementProgress[achievement.achievementId] ?? 0);
  }

  function isClaimed(objective: ObjectiveForDisplay, isDaily: boolean): boolean {
    refreshDailyState();
    if (isDaily) return state.value.dailyClaimed.includes(objective.id);

    const achievement = objective as ResolvedAchievement;
    const definition = ALL_ACHIEVEMENTS.find((item) => item.id === achievement.achievementId);
    return !!definition && getAchievementLevel(achievement.achievementId) >= definition.levels.length;
  }

  function isClaimable(objective: ObjectiveForDisplay, isDaily: boolean): boolean {
    return getProgress(objective, isDaily) >= objective.target && !isClaimed(objective, isDaily);
  }

  function track(event: ObjectiveEvent, amount = 1) {
    if (!isReady.value || amount <= 0) return;
    refreshDailyState();
    const increment = Number.isFinite(amount) ? amount : 0;
    if (increment <= 0) return;

    for (const objective of dailyObjectives.value) {
      if (objective.event === event && !isClaimed(objective, true)) {
        state.value.dailyProgress[objective.id] = Math.min(
          objective.target,
          (state.value.dailyProgress[objective.id] ?? 0) + increment,
        );
      }
    }

    for (const achievement of ALL_ACHIEVEMENTS) {
      if (achievement.kind !== "counter" || achievement.event !== event) continue;
      if (getAchievementLevel(achievement.id) >= achievement.levels.length) continue;
      const maxTarget = achievement.levels.at(-1)?.target ?? 0;
      state.value.achievementProgress[achievement.id] = Math.min(
        maxTarget,
        (state.value.achievementProgress[achievement.id] ?? 0) + increment,
      );
    }
  }

  /** Called once for the final totals of a run; it never evaluates a partial checkpoint. */
  function evaluateRun(stats: RunStats, durationMs = 0) {
    if (!isReady.value) return;

    for (const achievement of ALL_ACHIEVEMENTS) {
      if (achievement.kind !== "run") continue;
      const currentLevel = getAchievementLevel(achievement.id);
      const level = achievement.levels[currentLevel];
      if (!level || !matchesRunConditions(stats, level.conditions, durationMs)) continue;
      state.value.runAchievementReady[achievement.id] = currentLevel + 1;
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
        if (parsed?.version === 2) {
          state.value = {
            ...defaultState(),
            dailyUtcDay: typeof parsed.dailyUtcDay === "string" ? parsed.dailyUtcDay : getUtcDay(),
            dailyProgress: sanitizeProgress(parsed.dailyProgress),
            dailyClaimed: sanitizeIds(parsed.dailyClaimed),
            achievementProgress: sanitizeProgress(parsed.achievementProgress),
            achievementLevels: sanitizeProgress(parsed.achievementLevels),
            runAchievementReady: sanitizeProgress(parsed.runAchievementReady),
          };
        } else if (parsed?.version === 1) {
          // Preserve old counter progress; a claimed legacy achievement starts at level two.
          const legacyClaimed = sanitizeIds(parsed.achievementClaimed);
          state.value = {
            ...defaultState(),
            dailyUtcDay: typeof parsed.dailyUtcDay === "string" ? parsed.dailyUtcDay : getUtcDay(),
            dailyProgress: sanitizeProgress(parsed.dailyProgress),
            dailyClaimed: sanitizeIds(parsed.dailyClaimed),
            achievementProgress: sanitizeProgress(parsed.achievementProgress),
            achievementLevels: Object.fromEntries(legacyClaimed.map((id) => [id, 1])),
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

  async function claim(objective: ObjectiveForDisplay, isDaily: boolean): Promise<boolean> {
    refreshDailyState();
    if (!isClaimable(objective, isDaily) || isClaiming.value) return false;

    isClaiming.value = objective.id;
    error.value = null;
    try {
      const receipts = await RewardProcessor.applyAll(objective.reward);
      if (isDaily) {
        state.value.dailyClaimed.push(objective.id);
      } else {
        const achievement = objective as ResolvedAchievement;
        state.value.achievementLevels[achievement.achievementId] =
          getAchievementLevel(achievement.achievementId) + 1;
      }
      await useProgressStore().saveProgress();
      await persist();
      Telemetry.emit({ type: "reward.claimed", source: "objective", rewardId: objective.id, multiplier: 1, rewards: receipts });
      return true;
    } catch (cause) {
      console.error("[ObjectivesStore] claim error:", cause);
      error.value = "claim_failed";
      Telemetry.emit({ type: "reward.failed", source: "objective", rewardId: objective.id, reason: "claim_failed" });
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
    evaluateRun,
    persist,
    restore,
    claim,
  };
});
