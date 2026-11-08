import { LanePattern, type LanePattern as LanePatternValue } from "@/game/interactive/types/LanePattern";
import type {
  BoosterSetId,
  CoinSetId,
  DifficultyConfig,
  GameplayConfig,
  InteractiveConfig,
} from "@/levels/types";

type CoinType = Exclude<CoinSetId, "default">;
type BoosterType = Exclude<BoosterSetId, "default">;

export interface SpawnRules {
  allowCoins: boolean;
  allowPositiveBoosts: boolean;
  allowNegativeBoosts: boolean;
  coinTypes: CoinType[];
  boosterTypes: BoosterType[];
  coinChance: number;
  boostChance: number;
  positiveBoostChance: number;
  negativeBoostChance: number;
  obstacleChance: number;
  allowJumps: boolean;
}

export const DEFAULT_SPAWN_RULES: SpawnRules = {
  allowCoins: true,
  allowPositiveBoosts: true,
  allowNegativeBoosts: false,
  coinTypes: ["golden", "energon"],
  boosterTypes: ["nitro", "shield", "magnet", "bullet"],
  coinChance: 1,
  boostChance: 1,
  positiveBoostChance: 1,
  negativeBoostChance: 0,
  obstacleChance: 1,
  allowJumps: true,
};

function clampChance(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function resolveCoinTypes(coinSets: CoinSetId[]): CoinType[] {
  if (coinSets.includes("default")) return ["golden", "energon"];

  return coinSets.filter((type): type is CoinType => type !== "default");
}

function resolveBoosterTypes(boosterSets: BoosterSetId[]): BoosterType[] {
  if (boosterSets.includes("default")) {
    return ["nitro", "shield", "magnet", "bullet"];
  }

  return boosterSets.filter(
    (type): type is BoosterType => type !== "default",
  );
}

export function createSpawnRules(
  interactive: InteractiveConfig,
  difficulty: DifficultyConfig,
): SpawnRules {
  const gameplay: GameplayConfig = difficulty.gameplay;
  const coinTypes = resolveCoinTypes(interactive.coinSets);
  const boosterTypes = resolveBoosterTypes(interactive.boosterSets);

  return {
    allowCoins: difficulty.allowCoins && coinTypes.length > 0,
    allowPositiveBoosts:
      difficulty.allowPositiveBoosts && boosterTypes.length > 0,
    allowNegativeBoosts: difficulty.allowNegativeBoosts,
    coinTypes,
    boosterTypes,
    coinChance: clampChance(gameplay.coinSpawnChance * interactive.density),
    boostChance: clampChance(gameplay.boostSpawnChance * interactive.density),
    positiveBoostChance: clampChance(gameplay.positiveBoostChance),
    negativeBoostChance: clampChance(gameplay.negativeBoostChance),
    obstacleChance: clampChance(
      gameplay.obstacleSpawnChance * interactive.obstacleDensity,
    ),
    allowJumps: interactive.jumpSets.length > 0,
  };
}

export function resolveLanePatternBySpawnRules(
  value: LanePatternValue,
  rules: SpawnRules | undefined,
): LanePatternValue {
  const activeRules = rules ?? DEFAULT_SPAWN_RULES;

  if (isCoinPattern(value)) {
    if (
      !activeRules.allowCoins ||
      !isCoinTypeAllowed(value, activeRules.coinTypes)
    ) {
      return LanePattern.Empty;
    }

    return value;
  }

  if (value === LanePattern.JumpCoins) {
    if (!activeRules.allowJumps) return LanePattern.Empty;
    if (
      !activeRules.allowCoins ||
      !activeRules.coinTypes.includes("golden")
    ) {
      return LanePattern.Jump;
    }
    return value;
  }

  if (isPositiveBoostPattern(value)) {
    if (
      !activeRules.allowPositiveBoosts ||
      !isBoosterTypeAllowed(value, activeRules.boosterTypes)
    ) {
      return LanePattern.Empty;
    }

    return value;
  }

  if (isNegativeBoostPattern(value)) {
    if (
      !activeRules.allowNegativeBoosts ||
      !isBoosterTypeAllowed(value, activeRules.boosterTypes)
    ) {
      return LanePattern.Empty;
    }

    return value;
  }

  if (isObstaclePattern(value)) {
    return value;
  }

  if (value === LanePattern.Jump && !activeRules.allowJumps) {
    return LanePattern.Empty;
  }

  return value;
}

function isCoinTypeAllowed(
  value: LanePatternValue,
  coinTypes: CoinType[],
): boolean {
  if (value === LanePattern.Energon) return coinTypes.includes("energon");
  return coinTypes.includes("golden");
}

function isBoosterTypeAllowed(
  value: LanePatternValue,
  boosterTypes: BoosterType[],
): boolean {
  switch (value) {
    case LanePattern.Nitro:
      return boosterTypes.includes("nitro");
    case LanePattern.Shield:
      return boosterTypes.includes("shield");
    case LanePattern.Magnet:
      return boosterTypes.includes("magnet");
    case LanePattern.BulletItem:
      return boosterTypes.includes("bullet");
    case LanePattern.Booster:
      return boosterTypes.length > 0;
    default:
      return true;
  }
}

function isCoinPattern(value: LanePatternValue): boolean {
  return (
    value === LanePattern.Coin ||
    value === LanePattern.CoinLine ||
    value === LanePattern.Energon
  );
}

function isPositiveBoostPattern(value: LanePatternValue): boolean {
  return (
    value === LanePattern.Booster ||
    value === LanePattern.BulletItem ||
    value === LanePattern.Shield ||
    value === LanePattern.Magnet
  );
}

function isNegativeBoostPattern(value: LanePatternValue): boolean {
  return value === LanePattern.Nitro;
}

function isObstaclePattern(value: LanePatternValue): boolean {
  return (
    value === LanePattern.Obstacle ||
    value === LanePattern.Obstacle1 ||
    value === LanePattern.Obstacle2 ||
    value === LanePattern.Obstacle3 ||
    value === LanePattern.MovingObstacle ||
    value === LanePattern.EnemyCar
  );
}
