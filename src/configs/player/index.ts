import { ATLAS_SPRITES } from "@/assets/textures/atlasSprites";
import { MODELS } from "@/assets/models";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import type { TextureMap } from "@/game/car/CarVisualState";

export default {
  // ---- статические константы ----
  baseSpeed: 0.05,
  maxSpeed: 1.0,
  acceleration: 0.000005,
  forcedJumpMultiplier: 5,

  // коллайдер
  collider: {
    shrinkX: 1.0,
    shrinkZ: 1.0,
    yOffset: 0.0,
    heightFactor: 0.8,
  },

  // управление
  laneChangeSpeed: 0.26,
  maxTilt: 0.05,
  tiltSmoothing: 0.2,

  // прыжок
  jumpHeight: 4.0,

  // масса и инерция
  mass: {
    cubeDensity: 1,
    armorUnitMass: 0.55,
    ammoUnitMass: 0.1,
    corruptedNitroMass: 2.5,
    maxExtraMassRatio: 1.6,
    minControlMultiplier: 0.5,
    minJumpMultiplier: 0.55,
    minSpeedMultiplier: 0.75,
    controlPenaltyPerMassRatio: 0.18,
    jumpPenaltyPerMassRatio: 0.24,
    speedPenaltyPerMassRatio: 0.08,
    corruptedNitroControlPenalty: 0.18,
    lateralAcceleration: 0.03,
    lateralDamping: 0.18,
  },

  // нитро
  nitro: {
    multiplier: 1.5,
    afterImagePass: 0.8,
    rgbShift: 0.003,
    baseTimer: 5000,
    accelInSpeed: 0.005,
    accelOutSpeed: 0.001,
  },

  // магнит
  magnet: {
    baseTimer: 10000,
    force: 40,
    maxTargets: 8,
  },

  // визуальные эффекты
  defaultEmissionIntensity: 5,
  defaultBlinkDuration: 1,
  defaultBlinkSpeed: 10,

  // 👇 ИСПРАВЛЕНО: используем атлас вместо TEXTURES
  // материалы машины — теперь через атлас
  carMaterialConfig: {
    atlas: null as any, // будет заменён при инициализации
    atlasSprite: ATLAS_SPRITES.cube.base,
  } as MaterialConfig,

  // маппинг текстур на состояния (уже использует атлас)
  carMaterialConfigExtra: {
    default: ATLAS_SPRITES.cube.base,
    nitro: ATLAS_SPRITES.cube.nitro,
    shield: ATLAS_SPRITES.cube.armor,
    damage: ATLAS_SPRITES.cube.bullet,
  } as TextureMap,

  // маппинг цветов эмиссии
  carEmissionConfigExtra: {
    default: 0x000000,
    nitro: 0x005500,
    shield: 0x555555,
    damage: 0x550000,
  } as Record<string, number>,

  // ---- функции, зависящие от commonStore ----
  getCols: (xzScaling: number): [number, number, number] => [
    -xzScaling * 2,
    0,
    xzScaling * 2,
  ],

  getRows: (xzScaling: number): [number, number, number, number] => [
    xzScaling * 3,
    xzScaling,
    -xzScaling,
    -xzScaling * 3,
  ],

  getHeight: (baseItemYpos: number) => baseItemYpos / 2,

  getGlbScales: (xzScaling: number): [number, number, number] => [
    xzScaling,
    xzScaling,
    xzScaling,
  ],

  // генератор кубов машины
  getCarCubesConfig: (
    cols: [number, number, number],
    rows: [number, number, number, number],
    height: number,
    glbScales: [number, number, number],
  ): GeometryConfig[] => [
    {
      pos: [cols[1], height, rows[3]],
      scale: glbScales,
      name: "shield",
      modelUrl: MODELS.cube,
    },
    {
      pos: [cols[1], height, rows[2]],
      scale: glbScales,
      name: "default",
      modelUrl: MODELS.cube,
    },
    {
      pos: [cols[1], height, rows[1]],
      scale: glbScales,
      name: "default",
      modelUrl: MODELS.cube,
    },
    {
      pos: [cols[0], height, rows[0]],
      scale: glbScales,
      name: "nitro",
      modelUrl: MODELS.cube,
    },
    {
      pos: [cols[2], height, rows[0]],
      scale: glbScales,
      name: "nitro",
      modelUrl: MODELS.cube,
    },
    {
      pos: [cols[2], height, rows[2]],
      scale: glbScales,
      name: "nitro",
      modelUrl: MODELS.cube,
    },
    {
      pos: [cols[0], height, rows[2]],
      scale: glbScales,
      name: "nitro",
      modelUrl: MODELS.cube,
    },
  ],
};