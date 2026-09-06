export type RewardType =
  | "currency"
  | "consumable"
  | "upgrade"
  | "cosmetic"
  | "timed_feature"
  | "permanent_feature"
  | "ammo"
  | "armor"
  | "fortune_spin";

/** Common contract for rewards from purchases, daily gifts and future sources. */
export type RewardDefinition = {
  type: RewardType;
  effect: any;
  /**
   * Alternative reward used when the primary one cannot be applied.
   * For example, an upgrade can become currency after it reaches its level cap.
   */
  fallback?: RewardDefinition;
};
