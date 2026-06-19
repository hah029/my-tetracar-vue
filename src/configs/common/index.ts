import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import { MODELS } from "@/assets/models";
import { TEXTURES } from "@/assets/textures";

export default {
  // Масштаб по XZ (базовый)
  xzScaling: 1,

  // Вращение предметов
  baseItemRotation: 0.03,

  // Спавн и удаление
  baseSegmentsZpos: -100,
  itemsRemovingZpos: 30,
  baseSegmentDifficultyStep: 100,

  // Монеты и бустеры
  baseCoinValue: 1,
  coinSpawnProbabilities: {
    energon: 5,
    golden: 1000,
  },
  boosterSpawnProbabilities: {
    nitro: 1,
    shield: 0,
    magnet: 1,
    bullet: 0,
  },

  // Физика
  gravity: 30,
  friction: 2.5,
  bounceFactor: 0.4,
  collisionFactor: 0.2,
  removalHeight: 20,
  explosionForce: 25,
  explosionUpward: 20,

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

  // Базовый материал куба
  baseCubeMaterialConfig: {
    textureUrl: null,
    color: 0xffffff,
    emissive: 0x000000,
    emissiveIntensity: 1,
    ior: 1,
    transmission: 1,
    metalness: 1,
    roughness: 1,
    thickness: 1,
  },

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
  magnetMaterialConfig: {
    textureUrl: TEXTURES.cube.base,
    emissive: 0x000000,
    emissiveIntensity: 0.6,
  } as MaterialConfig,

  bulletMaterialConfig: {
    textureUrl: TEXTURES.cube.bullet,
    emissive: 0xdd0000,
    emissiveIntensity: 0.6,
  } as MaterialConfig,

  nitroMaterialConfig: {
    textureUrl: TEXTURES.cube.base,
    emissive: 0x00dd00,
    emissiveIntensity: 0.6,
  } as MaterialConfig,

  shieldMaterialConfig: {
    textureUrl: TEXTURES.cube.base,
    emissive: 0xffffff,
    emissiveIntensity: 0.6,
  } as MaterialConfig,

  goldenMaterialConfig: {
    textureUrl: TEXTURES.cube.golden,
    emissive: 0xefbf04,
    emissiveIntensity: 0.6,
    metalness: 4.0,
  } as MaterialConfig,

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
