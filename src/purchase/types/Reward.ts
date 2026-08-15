export type RewardType =
  | "currency"
  | "consumable"
  | "upgrade"
  | "cosmetic"
  | "timed_feature"
  | "permanent_feature"
  | "ammo"
  | "armor";

/** Common contract for rewards from purchases, daily gifts and future sources. */
export type RewardDefinition = {
  type: RewardType;
  effect: any;
};
