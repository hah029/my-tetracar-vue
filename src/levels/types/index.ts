/**
 * Уровень
 * Отвечает за визуал, окружение, интерактивные объекты,
 * игрока, музыку и награды.
 */
export interface LevelConfig {
  id: string;
  name: string;
  description?: string;

  /** Доступен ли уровень для выбора и запуска в текущем релизе. */
  enabled: boolean;

  /** Показывать ли карточку уровня на экране выбора. */
  to_show: boolean;

  /**
   * Идентификаторы сложностей, доступных для этого визуального уровня.
   * Если не указано, доступны все глобально опубликованные сложности.
   */
  difficultyIds?: readonly string[];

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

  /**
   * Атмосферные эффекты уровня: дождь, молнии и т.п.
   */
  weather?: WeatherConfig;
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

  /**
   * Короткие секции дороги, поднятые над базовой плоскостью.
   */
  elevatedSections?: RoadElevatedSectionConfig[];

  /**
   * Режим дорожного полотна. По умолчанию используется неподвижная плоскость.
   */
  roadMode?: "static" | "segmented";

  /** Включает подъёмы/спуски в runtime-сегментах. */
  enableElevatedSegments?: boolean;

  /** Включает поворотные runtime-сегменты. */
  enableCurvedSegments?: boolean;
}

export interface RoadElevatedSectionConfig {
  lanes: number[];
  zStart: number;
  length: number;
  height: number;
  rampLength: number;
  rampIn?: boolean;
  rampOut?: boolean;
  speedFactor?: number;
  color?: string;
  emissiveColor?: string;
  emissiveIntensity?: number;
  opacity?: number;
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
  type:
    | "city"
    | "hills"
    | "ocean"
    | "water_surface"
    | "terrain_surface"
    | "lava_flow"
    | "basalt_spire";
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
  waveAmplitude?: number;
  waveFrequency?: number;
  waveSpeed?: number;
  secondaryColor?: string;
}

export interface WeatherConfig {
  rain?: RainWeatherConfig;
  lightning?: LightningWeatherConfig;
  headlights?: HeadlightsWeatherConfig;
  sky?: AtmosphericSkyConfig;
  fireRocks?: FireRocksWeatherConfig;
}

export interface AtmosphericSkyConfig {
  enabled: boolean;
  topColor: string;
  bottomColor: string;
  cloudColor: string;
  opacity: number;
  noiseStrength: number;
  noiseScale: number;
  speed: number;
}

export interface FireRocksWeatherConfig {
  enabled: boolean;
  count: number;
  color: string;
  coreColor: string;
  opacity: number;
  areaWidth: number;
  areaDepth: number;
  minHeight: number;
  maxHeight: number;
  minFallSpeed: number;
  maxFallSpeed: number;
  windX: number;
  windZ: number;
  minSize: number;
  maxSize: number;
}

export interface RainWeatherConfig {
  enabled: boolean;
  count: number;
  color: string;
  opacity: number;
  areaWidth: number;
  areaDepth: number;
  height: number;
  dropLength: number;
  fallSpeed: number;
  windX?: number;
  windZ?: number;
}

export interface LightningWeatherConfig {
  enabled: boolean;
  color: string;
  minInterval: number;
  maxInterval: number;
  duration: number;
  intensity: number;
  position?: Vector3Tuple;
}

export interface HeadlightsWeatherConfig {
  enabled: boolean;
  color: string;
  intensity: number;
  distance: number;
  angle: number;
  penumbra: number;
  decay: number;
  targetDistance: number;
  positionOffsets: Vector3Tuple[];
  beamLength: number;
  beamRadius: number;
  beamOpacity: number;
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
   * Наборы дорожных сегментов, из которых уровень строит маршрут.
   */
  segmentSets?: SegmentSetId[];

  /**
   * Точный allow-list id сегментов. Если задан, применяется поверх segmentSets.
   */
  segmentIds?: string[];

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

export type SegmentSetId =
  | "base"
  | "traffic"
  | "rewards"
  | "jumpers"
  | "hazards"
  | "vertical"
  | "turns";

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
  shield?: ShieldVisualConfig;
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

export interface ShieldVisualConfig {
  color: string;
  radius: number;
  offsetY: number;
  offsetZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  opacity: number;
  timeScale: number;
}

export interface GameplayConfig {
  /**
   * Количество полос дороги.
   */
  laneCount: number;

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
   * Шанс, что выпавший буст станет corrupted-вариантом.
   */
  corruptedBoostChance: number;

  /**
   * Веса конкретных corrupted-вариантов внутри уже инвертированного буста.
   */
  corruptedBoostWeights: CorruptedBoostWeights;

  /**
   * Вероятность появления препятствий
   */
  obstacleSpawnChance: number;

  /**
   * Дистанция для прохождения уровня
   */
  targetDistance: number;
}

export type CorruptedNitroVariant = "heavyNitro";
export type CorruptedShieldVariant = "blindShield";
export type CorruptedMagnetVariant = "lethalMagnet" | "repulseMagnet";
export type CorruptedBoostVariant =
  | CorruptedNitroVariant
  | CorruptedShieldVariant
  | CorruptedMagnetVariant;

export interface CorruptedBoostWeights {
  nitro: Record<CorruptedNitroVariant, number>;
  shield: Record<CorruptedShieldVariant, number>;
  magnet: Record<CorruptedMagnetVariant, number>;
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
