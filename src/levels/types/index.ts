/**
 * Уровень
 * Отвечает за визуал, окружение, интерактивные объекты,
 * игрока, музыку и награды.
 */
export interface LevelConfig {
  id: string;
  name: string;
  description?: string;

  visual: VisualConfig;
  environment: EnvironmentConfig;
  interactive: InteractiveConfig;
  player: PlayerConfig;

  music: MusicConfig;
  rewards: RewardConfig;
}

/**
 * Сложность
 * Отвечает только за игровые правила.
 */
export interface DifficultyConfig {
  id: string;
  name: string;
  description?: string;

  allowCoins: boolean;
  allowPositiveBoosts: boolean;
  allowNegativeBoosts: boolean;

  gameplay: GameplayConfig;
}

/**
 * Чистый визуал уровня: камера, рендеринг и свет.
 */
export interface VisualConfig {
  camera: CameraConfig;
  render: RenderConfig;
  lighting: LightingConfig;
}

export interface CameraConfig {
  /**
   * Расстояние до машины
   */
  distance: number;

  /**
   * Высота камеры
   */
  height: number;

  /**
   * Field Of View
   */
  fov: number;

  /**
   * Максимальный FOV при разгоне
   */
  fovMax: number;

  /**
   * Наклон камеры по оси X
   */
  tilt: number;

  /**
   * Дистанция взгляда вперед по Z
   */
  lookahead: number;

  /**
   * Скорость следования камеры
   */
  followSpeed: number;

  /**
   * Коэффициент приближения камеры на скорости
   */
  distanceReductionFactor: number;
}

export interface RenderConfig {
  /**
   * Цвет фона сцены
   */
  backgroundColor: string;

  /**
   * Цвет тумана
   */
  fogColor: string;

  /**
   * Начало тумана
   */
  fogNear: number;

  /**
   * Конец тумана
   */
  fogFar: number;

  /**
   * Экспозиция tone mapping
   */
  toneMappingExposure: number;

  /**
   * Сила bloom-постобработки.
   */
  bloomStrength?: number;

  /**
   * Радиус bloom-постобработки.
   */
  bloomRadius?: number;

  /**
   * Порог bloom-постобработки.
   */
  bloomThreshold?: number;
}

export interface LightingConfig {
  /**
   * Цвет ambient света
   */
  ambientLightColor: string;

  /**
   * Интенсивность ambient света
   */
  ambientLightIntensity: number;

  /**
   * Цвет directional света
   */
  directionalLightColor: string;

  /**
   * Позиция directional света
   */
  directionalLightPosition?: Vector3Tuple;

  /**
   * Интенсивность directional света
   */
  directionalLightIntensity: number;

  /**
   * Цвет заполняющего света
   */
  fillLightColor: string;

  /**
   * Позиция заполняющего света
   */
  fillLightPosition?: Vector3Tuple;

  /**
   * Интенсивность заполняющего света
   */
  fillLightIntensity: number;

  /**
   * Цвет акцентного света позади машины
   */
  backAccentLightColor: string;

  /**
   * Позиция акцентного света
   */
  backAccentLightPosition?: Vector3Tuple;

  /**
   * Интенсивность акцентного света
   */
  backAccentLightIntensity: number;
}

export type Vector3Tuple = [number, number, number];

export interface EnvironmentConfig {
  /**
   * Дорога и связанные с ней элементы.
   */
  road: RoadEnvironmentConfig;

  /**
   * Нижний/боковой мир вокруг дороги: город, холмы, океан и т.д.
   */
  scenery: SceneryConfig;
}

export interface RoadEnvironmentConfig {
  /**
   * Цвет дороги
   */
  color: string;

  /**
   * Цвет свечения дороги
   */
  emissiveColor: string;

  /**
   * Интенсивность свечения дороги
   */
  emissiveIntensity: number;

  /**
   * Прозрачность дороги
   */
  opacity: number;

  /**
   * Цвет разметки
   */
  laneColor: string;

  /**
   * Позиции лейнов по X. Если не задано, используется дефолт дороги.
   */
  lanes?: number[];

  /**
   * Длина дорожного полотна.
   */
  length: number;

  /**
   * Бортики дороги.
   */
  edges: RoadEdgeConfig;

  /**
   * Боковые объекты вдоль дороги.
   */
  sideObjects?: RoadSideObjectsConfig;
}

export interface RoadEdgeConfig {
  color: string;
  height: number;
  opacity: number;
}

export interface RoadSideObjectsConfig {
  enabled: boolean;
  color: string;
  emissiveColor?: string;
  emissiveIntensity?: number;
  opacity?: number;
  spacing: number;
  offset: number;
  y: number;
  scale: [number, number, number];
}

export interface SceneryConfig {
  /**
   * Набор объектов окружения
   */
  scenerySets: string[];

  /**
   * Плотность декораций
   */
  sceneryDensity: number;

  /**
   * Дополнительные декоративные объекты
   */
  decorations: string[];

  /**
   * Слои instanced-окружения. Сейчас используется для нижнего города.
   */
  layers?: SceneryLayerConfig[];
}

export interface SceneryLayerConfig {
  type: "city";
  xMin: number;
  xMax: number;
  zStart: number;
  zEnd: number;
  spacing: number;
  speedFactor: number;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  y: number;
  color: string;
  emissiveColor?: string;
  emissiveIntensity?: number;
  opacity?: number;
}

export interface InteractiveConfig {
  /**
   * Набор монет/валюты.
   */
  coinSets: CoinSetId[];

  /**
   * Набор бустеров.
   */
  boosterSets: BoosterSetId[];

  /**
   * Набор препятствий.
   */
  obstacleSets: string[];

  /**
   * Набор трамплинов/джампов.
   */
  jumpSets: string[];

  /**
   * Множитель плотности интерактивных объектов уровня.
   * Конкретные шансы останутся в DifficultyConfig.
   */
  density: number;

  /**
   * Множитель плотности препятствий уровня.
   * Конкретные шансы останутся в DifficultyConfig.
   */
  obstacleDensity: number;
}

export type CoinSetId = "default" | "golden" | "energon";

export type BoosterSetId =
  | "default"
  | "nitro"
  | "shield"
  | "magnet"
  | "bullet";

export interface PlayerConfig {
  /**
   * Набор визуала машинки.
   */
  carSet: string;

  /**
   * Набор эффектов игрока: нитро, щит, магнит и т.д.
   */
  effectSet: string;

  /**
   * Визуальные параметры машинки и ее эффектов.
   */
  visual?: PlayerVisualConfig;
}

export interface PlayerVisualConfig {
  defaultEmissionIntensity?: number;
  defaultBlinkDuration?: number;
  defaultBlinkSpeed?: number;
  emissiveColors?: Partial<Record<PlayerVisualEffect, string>>;
  nitroTrail?: NitroTrailVisualConfig;
}

export type PlayerVisualEffect = "default" | "nitro" | "shield" | "damage";

export interface NitroTrailVisualConfig {
  color: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  timeScale: number;
}

export interface GameplayConfig {
  /**
   * Стартовая скорость
   */
  startSpeed: number;

  /**
   * Максимальная скорость
   */
  maxSpeed: number;

  /**
   * Скорость роста сложности
   */
  speedIncreaseRate: number;

  /**
   * Вероятность появления монет
   */
  coinSpawnChance: number;

  /**
   * Вероятность появления любого буста
   */
  boostSpawnChance: number;

  /**
   * Соотношение положительных бустов
   * 0..1
   */
  positiveBoostChance: number;

  /**
   * Соотношение отрицательных бустов
   * 0..1
   */
  negativeBoostChance: number;

  /**
   * Вероятность появления препятствий
   */
  obstacleSpawnChance: number;

  /**
   * Дистанция для прохождения уровня
   */
  targetDistance: number;
}

export interface MusicConfig {
  /**
   * Музыка меню уровня
   */
  menuTrack?: string;

  /**
   * Музыка во время заезда
   */
  gameTrack: string;
}

export interface RewardConfig {
  /**
   * Награда за прохождение
   */
  coins: number;

  /**
   * Идентификаторы открываемого контента
   */
  unlocks?: string[];
}
