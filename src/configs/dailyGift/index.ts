import type { RewardDefinition } from "@/purchase/types";

export type DailyGiftDayConfig = {
  day: number;
  rewards: RewardDefinition[];
};

export const DAILY_GIFT_CYCLE_LENGTH = 7;

export const DAILY_GIFT_REWARDS: DailyGiftDayConfig[] = [
  { day: 1, rewards: [{ type: "currency", effect: { currency: "golden", amount: 200 } }] },
  { day: 2, rewards: [{ type: "currency", effect: { currency: "golden", amount: 300 } }, { type: "ammo", effect: { amount: 1 } }] },
  { day: 3, rewards: [{ type: "currency", effect: { currency: "golden", amount: 500 } }] },
  { day: 4, rewards: [{ type: "currency", effect: { currency: "golden", amount: 700 } }, { type: "armor", effect: { amount: 1 } }] },
  { day: 5, rewards: [{ type: "currency", effect: { currency: "energon", amount: 1 } }] },
  { day: 6, rewards: [{ type: "currency", effect: { currency: "golden", amount: 1000 } }, { type: "ammo", effect: { amount: 1 } }, { type: "armor", effect: { amount: 1 } }] },
  { day: 7, rewards: [{ type: "currency", effect: { currency: "energon", amount: 5 } }] },
];

export function getDailyGiftCycleMultiplier(cycleNumber: number): number {
  return [1, 1.5, 2][(Math.max(cycleNumber, 1) - 1) % 3] ?? 1;
}

export function getDailyGiftRewards(day: number, cycleNumber: number): RewardDefinition[] {
  const rewards = DAILY_GIFT_REWARDS.find((item) => item.day === day)?.rewards ?? [];
  const multiplier = getDailyGiftCycleMultiplier(cycleNumber);
  return rewards.map((reward) => reward.type !== "currency"
    ? { ...reward, effect: { ...reward.effect } }
    : { ...reward, effect: { ...reward.effect, amount: Math.round(reward.effect.amount * multiplier) } });
}
