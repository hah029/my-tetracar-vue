import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import { MODELS } from "@/assets/models";
import {
  baseCubeMaterialConfig,
  bulletMaterialConfig,
  goldenMaterialConfig,
  magnetMaterialConfig,
  nitroMaterialConfig,
  shieldMaterialConfig,
} from "./materials";
import { basePhysics } from "./physics";
import { boosterSpawnProbabilities, coinSpawnProbabilities } from "./spawn";

export default {
  // Масштаб по XZ (базовый)
  xzScaling: 1,

  // Вращение предметов
  baseItemRotation: 0.03,

  // Спавн и удаление
  baseSegmentsZpos: -100,
  itemsRemovingZpos: 30,
  baseSegmentDifficultyStep: 100,
  segmentRowMinLength: 8,
//   segmentRowTargetTravelMs: 140,
  segmentRowTargetTravelMs: 80,

  // Монеты и бустеры
  baseCoinValue: 1,
  spawnProbabilities: {
    coins: coinSpawnProbabilities,
    boosters: boosterSpawnProbabilities,
  },

  // Физика
  physics: { ...basePhysics, cubeRotationSpeed: 0.03 },

  // Пуля
  bulletDefaultSpeed: 0.15,
  bulletMaxDistance: 100,
  bulletDefaultMaterial: {
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 10,
  },
  bulletGeometry: [1, 1, 1] as [number, number, number],

  // Дроп при разрушении
  allowCorruptedBoostDrops: false,
  destroyedRolldropWeights: {
    golden_coin: 20,
    bullet: 20,
    shield_booster: 10,
    energon_coin: 20,
    nitro_booster: 1,
    magnet_booster: 1,
  },

  // Опасная дистанция
  dangerDistance: 30,
  collisionCooldownMs: 1000,

  // Эффекты
  flashSizeDefault: 6,
  explosionSizeDefault: 6,
  flashDurationDefault: 100,
  explosionDurationDefault: 500,

  // Размеры прыжка
  jumpWidth: 5,
  jumpHeight: 1,
  jumpDepth: 8,

  // Движущееся препятствие
  movingObstacleSpeed: 0.01,

  // Материалы бустеров
  materials: {
    base: baseCubeMaterialConfig,
    magnet: magnetMaterialConfig,
    bullet: bulletMaterialConfig,
    nitro: nitroMaterialConfig,
    shield: shieldMaterialConfig,
    golden: goldenMaterialConfig,
  },

  // Генераторы структур, зависящих от XZ_SCALING
  getBaseItemYpos(xzScaling: number) {
    return xzScaling / 2;
  },

  getItemGeometryConfig(xzScaling: number): GeometryConfig {
    return {
      scale: [xzScaling, xzScaling, xzScaling],
      modelUrl: MODELS.cube,
    };
  },

  getSegmentRowLengths(xzScaling: number) {
    const body = xzScaling * 3;
    const spacing = body;
    return {
      body,
      spacing,
      total: body + spacing,
    };
  },

  getOptimizedObstacleForms(
    xzScaling: number,
    yPos: number,
  ): GeometryConfig[][] {
    const lxps = -2 * xzScaling;
    const rxps = 2 * xzScaling;
    return [
      [
        {
          pos: [0, yPos, 0],
          scale: [xzScaling, xzScaling, xzScaling],
          modelUrl: MODELS.obstacle1x3,
        },
      ],
      [
        {
          pos: [0, yPos, 0],
          scale: [xzScaling, xzScaling, xzScaling],
          modelUrl: MODELS.obstacle2x3,
        },
      ],
      [
        {
          pos: [0, yPos, 0],
          scale: [xzScaling, xzScaling, xzScaling],
          modelUrl: MODELS.obstacle3x3,
        },
      ],
    ];
  },

  getFullObstacleForms(xzScaling: number, yPos: number): GeometryConfig[][] {
    const lxps = -2 * xzScaling;
    const rxps = 2 * xzScaling;
    const s = xzScaling;
    // возвращаем три варианта: 3x1, 3x2, 3x3
    return [
      // стена 3x1
      [
        { pos: [lxps, yPos, 0], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [0, yPos, 0], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [rxps, yPos, 0], scale: [s, s, s], modelUrl: MODELS.cube },
      ],
      // стена 3x2
      [
        { pos: [lxps, yPos, 0], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [0, yPos, 0], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [rxps, yPos, 0], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [lxps, yPos, -2 * s], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [0, yPos, -2 * s], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [rxps, yPos, -2 * s], scale: [s, s, s], modelUrl: MODELS.cube },
      ],
      // стена 3x3
      [
        { pos: [lxps, yPos, 0], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [0, yPos, 0], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [rxps, yPos, 0], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [lxps, yPos, -2 * s], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [0, yPos, -2 * s], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [rxps, yPos, -2 * s], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [lxps, yPos, -4 * s], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [0, yPos, -4 * s], scale: [s, s, s], modelUrl: MODELS.cube },
        { pos: [rxps, yPos, -4 * s], scale: [s, s, s], modelUrl: MODELS.cube },
      ],
    ];
  },
};
