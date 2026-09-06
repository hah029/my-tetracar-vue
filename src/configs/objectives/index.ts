import type { RewardDefinition } from "@/purchase/types";
import type { RunStats } from "@/telemetry/events";

export type ObjectiveEvent =
  | "game_started"
  | "game_finished"
  | "distance_travelled"
  | "golden_collected"
  | "energon_collected"
  | "jump_performed"
  | "obstacle_destroyed"
  | "booster_collected";

export type ObjectiveDefinition = {
  id: string;
  event: ObjectiveEvent;
  target: number;
  reward: RewardDefinition[];
};

/** A daily template supplies a target for every day of the seven-day gift cycle. */
export type DailyObjectiveTemplate = Omit<ObjectiveDefinition, "target"> & {
  targetsByDay: readonly number[];
};

export type AchievementLevel = {
  target: number;
  reward: RewardDefinition[];
};

export type CounterAchievementDefinition = {
  id: string;
  kind: "counter";
  event: ObjectiveEvent;
  levels: readonly AchievementLevel[];
};

export type RunStatPath =
  | "distance"
  | "score"
  | "durationMs"
  | "itemsCollected.golden"
  | "itemsCollected.energon"
  | "itemsCollected.ammo"
  | "itemsCollected.armor"
  | "itemsCollected.nitro"
  | "itemsCollected.magnet"
  | "shield.hits"
  | "shield.breaks"
  | "shield.activeMs"
  | "jumps.manualStarted"
  | "jumps.rampStarted"
  | "jumpsCompleted"
  | "combat.shotsFired"
  | "combat.shotsHit"
  | "combat.shotsMissed"
  | "combat.shotsBlockedNoAmmo"
  | "obstaclesDestroyed.bullet"
  | "obstaclesDestroyed.shield";

export type RunCondition = {
  path: RunStatPath;
  operator: ">=" | "<=" | "=";
  value: number;
};

export type RunAchievementLevel = {
  conditions: readonly RunCondition[];
  reward: RewardDefinition[];
};

export type RunAchievementDefinition = {
  id: string;
  kind: "run";
  levels: readonly RunAchievementLevel[];
};

export type AchievementDefinition =
  | CounterAchievementDefinition
  | RunAchievementDefinition;

export type ResolvedAchievement = ObjectiveDefinition & {
  achievementId: string;
  level: number;
  kind: AchievementDefinition["kind"];
  conditions?: readonly RunCondition[];
};

const DAILY_TARGET_CYCLE_MULTIPLIERS = [1, 1.1, 1.2] as const;

export const DAILY_OBJECTIVE_TEMPLATES: readonly DailyObjectiveTemplate[] = [
  {
    id: "daily_collect_goldens",
    event: "golden_collected",
    targetsByDay: [75, 100, 125, 150, 175, 200, 250],
    reward: [{ type: "currency", effect: { currency: "golden", amount: 150 } }],
  },
  {
    id: "daily_drive_distance",
    event: "distance_travelled",
    targetsByDay: [750, 1_000, 1_250, 1_500, 2_000, 2_500, 3_000],
    reward: [{ type: "fortune_spin", effect: { amount: 1 } }],
  },
  {
    id: "daily_destroy_obstacles",
    event: "obstacle_destroyed",
    targetsByDay: [3, 4, 5, 6, 7, 8, 10],
    reward: [{ type: "currency", effect: { currency: "energon", amount: 1 } }],
  },
];

/** Resolves one deterministic daily set from the same day and cycle as daily gifts. */
export function getDailyObjectives(day: number, cycleNumber: number): ObjectiveDefinition[] {
  const dayIndex = Math.min(Math.max(day, 1), 7) - 1;
  const multiplier = DAILY_TARGET_CYCLE_MULTIPLIERS[
    (Math.max(cycleNumber, 1) - 1) % DAILY_TARGET_CYCLE_MULTIPLIERS.length
  ];

  return DAILY_OBJECTIVE_TEMPLATES.map(({ targetsByDay, ...objective }) => ({
    ...objective,
    target: Math.round(targetsByDay[dayIndex] * multiplier),
  }));
}

export const ACHIEVEMENTS: readonly CounterAchievementDefinition[] = [
  {
    id: "achievement_first_drive",
    kind: "counter",
    event: "game_finished",
    levels: [{ target: 1, reward: [{ type: "currency", effect: { currency: "golden", amount: 100 } }] }],
  },
  {
    id: "achievement_golden_collector",
    kind: "counter",
    event: "golden_collected",
    levels: [1_000, 10_000, 100_000, 1_000_000, 10_000_000].map((target) => ({
      target,
      reward: [{ type: "fortune_spin", effect: { amount: 1 } }],
    })),
  },
  {
    id: "achievement_long_road",
    kind: "counter",
    event: "distance_travelled",
    levels: [10_000, 100_000, 1_000_000, 10_000_000, 100_000_000].map((target) => ({
      target,
      reward: [{ type: "currency", effect: { currency: "golden", amount: 500 } }],
    })),
  },
  {
    id: "achievement_stunt_driver",
    kind: "counter",
    event: "jump_performed",
    levels: [100, 1_000, 10_000, 100_000, 1_000_000].map((target) => ({
      target,
      reward: [{ type: "currency", effect: { currency: "energon", amount: 2 } }],
    })),
  },
  {
    id: "achievement_demolition",
    kind: "counter",
    event: "obstacle_destroyed",
    levels: [100, 1_000, 10_000, 100_000, 1_000_000].map((target) => ({
      target,
      reward: [{ type: "armor", effect: { amount: 1 } }],
    })),
  },
];

/**
 * One-run achievements are evaluated against RunStats on run.finished.
 * Keep this empty until the final challenges and rewards are balanced.
 */
export const RUN_ACHIEVEMENTS: readonly RunAchievementDefinition[] = [];

export const ALL_ACHIEVEMENTS: readonly AchievementDefinition[] = [
  ...ACHIEVEMENTS,
  ...RUN_ACHIEVEMENTS,
];

export function getRunStat(stats: RunStats, path: RunStatPath, durationMs = 0): number {
  if (path === "durationMs") return durationMs;
  const value = path.split(".").reduce<unknown>((current, key) =>
    current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined,
  stats);
  return typeof value === "number" ? value : 0;
}

export function matchesRunConditions(
  stats: RunStats,
  conditions: readonly RunCondition[],
  durationMs = 0,
): boolean {
  return conditions.every(({ path, operator, value }) => {
    const actual = getRunStat(stats, path, durationMs);
    return operator === ">=" ? actual >= value : operator === "<=" ? actual <= value : actual === value;
  });
}
