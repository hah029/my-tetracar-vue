import type { RewardDefinition } from "@/purchase/types";

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

export const DAILY_OBJECTIVES: readonly ObjectiveDefinition[] = [
  {
    id: "daily_collect_goldens",
    event: "golden_collected",
    target: 20,
    reward: [{ type: "currency", effect: { currency: "golden", amount: 150 } }],
  },
  {
    id: "daily_drive_distance",
    event: "distance_travelled",
    target: 150,
    reward: [{ type: "fortune_spin", effect: { amount: 1 } }],
  },
  {
    id: "daily_destroy_obstacles",
    event: "obstacle_destroyed",
    target: 5,
    reward: [{ type: "currency", effect: { currency: "energon", amount: 1 } }],
  },
];

export const ACHIEVEMENTS: readonly ObjectiveDefinition[] = [
  {
    id: "achievement_first_drive",
    event: "game_finished",
    target: 1,
    reward: [{ type: "currency", effect: { currency: "golden", amount: 100 } }],
  },
  {
    id: "achievement_golden_collector",
    event: "golden_collected",
    target: 100,
    reward: [{ type: "fortune_spin", effect: { amount: 1 } }],
  },
  {
    id: "achievement_long_road",
    event: "distance_travelled",
    target: 1_000,
    reward: [{ type: "currency", effect: { currency: "golden", amount: 500 } }],
  },
  {
    id: "achievement_stunt_driver",
    event: "jump_performed",
    target: 25,
    reward: [{ type: "currency", effect: { currency: "energon", amount: 2 } }],
  },
  {
    id: "achievement_demolition",
    event: "obstacle_destroyed",
    target: 50,
    reward: [{ type: "armor", effect: { amount: 1 } }],
  },
];
