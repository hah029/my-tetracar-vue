import type { DifficultyConfig } from "@/levels/types";

export const DIFFICULTIES = {
  easy: {
    id: "easy",
    name: "Easy",
    description: "Lower speed, fewer obstacles and more forgiving pickups.",
    allowCoins: true,
    allowPositiveBoosts: true,
    allowNegativeBoosts: false,
    gameplay: {
      startSpeed: 0.04,
      maxSpeed: 0.75,
      speedIncreaseRate: 0.000003,
      coinSpawnChance: 0.8,
      boostSpawnChance: 0.2,
      positiveBoostChance: 1,
      negativeBoostChance: 0,
      obstacleSpawnChance: 0.45,
      targetDistance: 800,
    },
  },
  normal: {
    id: "normal",
    name: "Normal",
    description: "Current baseline balance for speed, pickups and obstacles.",
    allowCoins: true,
    allowPositiveBoosts: true,
    allowNegativeBoosts: true,
    gameplay: {
      startSpeed: 0.05,
      maxSpeed: 1.0,
      speedIncreaseRate: 0.000005,
      coinSpawnChance: 1,
      boostSpawnChance: 1,
      positiveBoostChance: 1,
      negativeBoostChance: 0,
      obstacleSpawnChance: 1,
      targetDistance: 1000,
    },
  },
  hard: {
    id: "hard",
    name: "Hard",
    description: "Higher speed, scarce boosts and tighter obstacle rhythm.",
    allowCoins: true,
    allowPositiveBoosts: true,
    allowNegativeBoosts: true,
    gameplay: {
      startSpeed: 0.07,
      maxSpeed: 1.2,
      speedIncreaseRate: 0.000007,
      coinSpawnChance: 0.45,
      boostSpawnChance: 0.12,
      positiveBoostChance: 0.65,
      negativeBoostChance: 0.35,
      obstacleSpawnChance: 0.85,
      targetDistance: 1200,
    },
  },
} as const satisfies Record<string, DifficultyConfig>;

export type DifficultyId = keyof typeof DIFFICULTIES;

export const DEFAULT_DIFFICULTY_ID: DifficultyId = "normal";

export const DIFFICULTY_LIST = Object.values(DIFFICULTIES);
