export type UpgradeKey =
  | "ammoLevel"
  | "armorLevel"
  | "magnetLevel"
  | "nitroDurationLevel";
export type UpgradePrice = {
  value: number;
  currency: "golden" | "energon";
};
type UpgradeDefinition<T extends Record<string, number>> = {
  upgradeKey: UpgradeKey;
  base: T;
  levels: readonly { stats: T; price: UpgradePrice }[];
};

const boosts = {
  ammo: {
    upgradeKey: "ammoLevel",
    base: { count: 3, speed: 0.15 },
    levels: [
      {
        stats: { count: 5, speed: 0.2 },
        price: { value: 10_000, currency: "golden" },
      },
      {
        stats: { count: 7, speed: 0.25 },
        price: { value: 50_000, currency: "golden" },
      },
      {
        stats: { count: 10, speed: 0.3 },
        price: { value: 100, currency: "energon" },
      },
    ],
  } satisfies UpgradeDefinition<{ count: number; speed: number }>,
  armor: {
    upgradeKey: "armorLevel",
    base: { count: 1, waveRadius: 0 },
    levels: [
      {
        stats: { count: 1, waveRadius: 3 },
        price: { value: 10_000, currency: "golden" },
      },
      {
        stats: { count: 2, waveRadius: 5 },
        price: { value: 50_000, currency: "golden" },
      },
      {
        stats: { count: 3, waveRadius: 7 },
        price: { value: 100, currency: "energon" },
      },
    ],
  } satisfies UpgradeDefinition<{ count: number; waveRadius: number }>,
  magnet: {
    upgradeKey: "magnetLevel",
    base: { durationMs: 5_000, radius: 10, radiusLaneBonus: 0, maxTargets: 2 },
    levels: [
      {
        stats: {
          durationMs: 6_000,
          radius: 10,
          radiusLaneBonus: 0,
          maxTargets: 4,
        },
        price: { value: 10_000, currency: "golden" },
      },
      {
        stats: {
          durationMs: 7_000,
          radius: 10,
          radiusLaneBonus: 0,
          maxTargets: 6,
        },
        price: { value: 50_000, currency: "golden" },
      },
      {
        stats: {
          durationMs: 8_000,
          radius: 10,
          radiusLaneBonus: 1,
          maxTargets: 8,
        },
        price: { value: 100, currency: "energon" },
      },
    ],
  } satisfies UpgradeDefinition<{
    durationMs: number;
    radius: number;
    radiusLaneBonus: number;
    maxTargets: number;
  }>,
  nitro: {
    upgradeKey: "nitroDurationLevel",
    base: { durationMs: 5_000 },
    levels: [
      {
        stats: { durationMs: 6_000 },
        price: { value: 10_000, currency: "golden" },
      },
      {
        stats: { durationMs: 7_000 },
        price: { value: 50_000, currency: "golden" },
      },
      {
        stats: { durationMs: 8_000 },
        price: { value: 100, currency: "energon" },
      },
    ],
  } satisfies UpgradeDefinition<{ durationMs: number }>,
} as const;

/** Runtime behaviour of non-standard pickup variants. Spawn odds stay level-specific. */
export const BOOST_SPECIAL_MODES = {
  nitro: {
    normal: {
      speedMultiplier: 1.5,
      rewardMultiplier: 2,
      scoreMultiplier: 2,
      invulnerable: true,
    },
    super: {
      durationMs: 2_500,
      speedMultiplier: 3,
      rewardMultiplier: 10,
      scoreMultiplier: 10,
      invulnerable: true,
    },
    corrupted: {
      speedMultiplier: 1.25,
      rewardMultiplier: 1,
      scoreMultiplier: 1,
      invulnerable: false,
      controlPenalty: 0.18,
    },
  },
  magnet: {
    super: { durationMs: 8_000, radiusMultiplier: 1.75, maxTargetsBonus: 6 },
    corrupted: {
      lethalPull: { forceMultiplier: 0.45 },
      repulse: { pushDistance: 0.018 },
    },
  },
  shield: { super: { waveRadius: 14 }, corrupted: { blindnessMs: 450 } },
  bullet: {
    piercing: { maxHits: 3 },
    explosive: { radius: 7 },
    fan: { laneOffsets: [-1, 0, 1] as const, lateralSpeedStep: 0.055 },
    railgun: { length: 100, lifetimeMs: 150 },
  },
} as const;

type AnyDefinition = UpgradeDefinition<Record<string, number>>;
const definitions = Object.values(boosts) as readonly AnyDefinition[];

export function getUpgradeMaxLevel(key: string): number | undefined {
  return definitions.find((definition) => definition.upgradeKey === key)?.levels
    .length;
}

export function getUpgradeState(
  key: string,
  level: number,
): Record<string, number> | null {
  const definition = definitions.find((item) => item.upgradeKey === key);
  if (!definition) return null;
  const states = [
    definition.base,
    ...definition.levels.map((item) => item.stats),
  ];
  const index = Math.max(
    0,
    Math.min(Math.floor(level) || 0, states.length - 1),
  );
  return states[index] ?? definition.base;
}

/** Price for advancing from the current level to the next one. */
export function getUpgradePrice(
  key: string,
  currentLevel: number,
): UpgradePrice | null {
  const definition = definitions.find((item) => item.upgradeKey === key);
  if (!definition) return null;
  const index = Math.max(0, Math.floor(currentLevel) || 0);
  return definition.levels[index]?.price ?? null;
}

export default { boosts, specialModes: BOOST_SPECIAL_MODES };
