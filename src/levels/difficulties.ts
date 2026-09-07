import type { DifficultyConfig } from "@/levels/types";

export const DIFFICULTIES = {
  normal: {
    id: "normal",
    name: "Normal",
    description: "Current baseline balance for speed, pickups and obstacles.",
    allowCoins: true,
    allowPositiveBoosts: true,
    allowNegativeBoosts: true,
    gameplay: {
      laneCount: 5,
      startSpeed: 0.05,
      maxSpeed: 1.0,
      speedIncreaseRate: 0.000005,
      coinSpawnChance: 1,
      boostSpawnChance: 1,
      positiveBoostChance: 1,
      negativeBoostChance: 0,
      corruptedBoostChance: 0.1,
      superMagnetChance: 0.05,
      superBulletChance: 0.05,
      superNitroChance: 0.03,
      superBulletWeights: { piercing: 1, explosive: 1, fan: 1, railgun: 1 },
      corruptedBoostWeights: {
        nitro: { heavyNitro: 1 },
        shield: { blindShield: 1 },
        magnet: { lethalMagnet: 0, repulseMagnet: 1 },
        bullet: { blankBullet: 1 },
      },
      obstacleSpawnChance: 1,
      targetDistance: 1000,
    },
  },
  hard: {
    id: "hard",
    name: "Hard",
    description: "Higher speed, scarce boosts and tighter obstacle rhythm.",
    allowCoins: true,
    allowPositiveBoosts: false,
    allowNegativeBoosts: false,
    gameplay: {
      laneCount: 5,
      startSpeed: 0.07,
      maxSpeed: 1.2,
      speedIncreaseRate: 0.000007,
      coinSpawnChance: 0,
      boostSpawnChance: 0,
      positiveBoostChance: 0,
      negativeBoostChance: 0,
      corruptedBoostChance: 0,
      superMagnetChance: 0,
      superBulletChance: 0,
      superNitroChance: 0,
      superBulletWeights: { piercing: 1, explosive: 1, fan: 1, railgun: 1 },
      corruptedBoostWeights: {
        nitro: { heavyNitro: 1 },
        shield: { blindShield: 1 },
        magnet: { lethalMagnet: 0, repulseMagnet: 1 },
        bullet: { blankBullet: 1 },
      },
      obstacleSpawnChance: 0.85,
      targetDistance: 1200,
    },
  },
} as const satisfies Record<string, DifficultyConfig>;

export type DifficultyId = keyof typeof DIFFICULTIES;

export const DEFAULT_DIFFICULTY_ID: DifficultyId = "normal";

export const DIFFICULTY_LIST = Object.values(DIFFICULTIES);
