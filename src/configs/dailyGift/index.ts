import type { RewardDefinition } from "@/purchase/types";

export type DailyGiftDayConfig = {
  day: number;
  rewards: RewardDefinition[];
};

export const DAILY_GIFT_CYCLE_LENGTH = 7;

export const DAILY_GIFT_REWARDS: DailyGiftDayConfig[] = [
  // week 1
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 0 + 1,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 100 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 0 + 2,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 250 } },
      { type: "ammo", effect: { amount: 3 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 0 + 3,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 500 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 0 + 4,
    rewards: [{ type: "fortune_spin", effect: { amount: 1 } }],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 0 + 5,
    rewards: [
      { type: "currency", effect: { currency: "energon", amount: 1 } },
      { type: "armor", effect: { amount: 1 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 0 + 6,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 750 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 0 + 7,
    rewards: [{ type: "cosmetic", effect: { skinId: "???" } }],
  },
  // week 2
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 1 + 1,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 500 } },
      { type: "currency", effect: { currency: "energon", amount: 2 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 1 + 2,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 750 } },
      {
        type: "upgrade",
        effect: { upgrade: "armorLevel", value: 1 },
        fallback: {
          type: "currency",
          effect: { currency: "golden", amount: 750 },
        },
      },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 1 + 3,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 1000 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 1 + 4,
    rewards: [{ type: "fortune_spin", effect: { amount: 1 } }],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 1 + 5,
    rewards: [
      { type: "currency", effect: { currency: "energon", amount: 2 } },
      {
        type: "upgrade",
        effect: { upgrade: "ammoLevel", value: 1 },
        fallback: {
          type: "currency",
          effect: { currency: "energon", amount: 2 },
        },
      },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 1 + 6,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 1250 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 1 + 7,
    rewards: [{ type: "cosmetic", effect: { skinId: "???" } }],
  },
  // week 3
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 2 + 1,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 1500 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 2 + 2,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 1750 } },
      {
        type: "upgrade",
        effect: { upgrade: "magnetRadiusLevel", value: 1 },
        fallback: {
          type: "currency",
          effect: { currency: "golden", amount: 1750 },
        },
      },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 2 + 3,
    rewards: [{ type: "currency", effect: { currency: "energon", amount: 3 } }],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 2 + 4,
    rewards: [{ type: "fortune_spin", effect: { amount: 1 } }],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 2 + 5,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 2000 } },
      {
        type: "upgrade",
        effect: { upgrade: "ammoLevel", value: 1 },
        fallback: {
          type: "currency",
          effect: { currency: "golden", amount: 2000 },
        },
      },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 2 + 6,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 3000 } },
      { type: "currency", effect: { currency: "energon", amount: 4 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 2 + 7,
    rewards: [{ type: "cosmetic", effect: { skinId: "???" } }],
  },
  // week 4
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 3 + 1,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 5000 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 3 + 2,
    rewards: [
      { type: "currency", effect: { currency: "energon", amount: 5 } },
      {
        type: "upgrade",
        effect: { upgrade: "ammoLevel", value: 1 },
        fallback: {
          type: "currency",
          effect: { currency: "energon", amount: 5 },
        },
      },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 3 + 3,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 7500 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 3 + 4,
    rewards: [{ type: "fortune_spin", effect: { amount: 1 } }],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 3 + 5,
    rewards: [
      { type: "currency", effect: { currency: "golden", amount: 10000 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 3 + 6,
    rewards: [
      { type: "currency", effect: { currency: "energon", amount: 10 } },
    ],
  },
  {
    day: DAILY_GIFT_CYCLE_LENGTH * 3 + 7,
    rewards: [{ type: "cosmetic", effect: { skinId: "???" } }],
  },
];

// export function getDailyGiftCycleMultiplier(cycleNumber: number): number {
//   return [1, 1.5, 2][(Math.max(cycleNumber, 1) - 1) % 3] ?? 1;
// }

export function getDailyGiftRewards(
  day: number,
  // weekNumber: number,
): RewardDefinition[] {
  return DAILY_GIFT_REWARDS.find((item) => item.day === day)?.rewards ?? [];
  // const multiplier = getDailyGiftCycleMultiplier(cycleNumber);
  // return rewards.map((reward) =>
  //   reward.type !== "currency"
  //     ? { ...reward, effect: { ...reward.effect } }
  //     : {
  //         ...reward,
  //         effect: {
  //           ...reward.effect,
  //           amount: Math.round(reward.effect.amount * multiplier),
  //         },
  //       },
  // );
}

export function getDailyGiftWeekNumber(day: number): number {
  return Math.floor((day - 1) / DAILY_GIFT_CYCLE_LENGTH) + 1;
}
