import { defineStore } from "pinia";
import { ref, computed } from "vue";
import commonConfig from "@/configs/common";

export const useCommonStore = defineStore("common", () => {
  const config = ref(commonConfig);

  // Удобные ссылки на часто используемые значения
  const xzScaling = computed(() => config.value.xzScaling);
  const baseItemYpos = computed(() =>
    config.value.getBaseItemYpos(xzScaling.value),
  );

  // Геометрия предметов (зависит от XZ_SCALING)
  const itemGeometryConfig = computed(() =>
    config.value.getItemGeometryConfig(xzScaling.value),
  );

  // Параметры сегментов дороги
  const segmentRowLengths = computed(() =>
    config.value.getSegmentRowLengths(xzScaling.value),
  );

  // Формы препятствий
  const optimizedObstacleForms = computed(() =>
    config.value.getOptimizedObstacleForms(xzScaling.value, baseItemYpos.value),
  );
  const fullObstacleForms = computed(() =>
    config.value.getFullObstacleForms(xzScaling.value, baseItemYpos.value),
  );

  // Физический блок
  function getBasePhysics() {
    return config.value.physics;
  }

  return {
    // реактивный конфиг целиком
    config,

    // вычисляемые производные
    XZ_SCALING: xzScaling,
    BASE_ITEM_YPOS: baseItemYpos,
    ITEM_GEOMETRY_CONFIG: itemGeometryConfig,
    OPTIMIZED_OBSTACLE_FORMS: optimizedObstacleForms,
    FULL_OBSTACLE_FORMS: fullObstacleForms,
    SEGMENT_ROW_BODY_LENGTH: computed(() => segmentRowLengths.value.body),
    SEGMENT_ROW_SPACING_LENGTH: computed(() => segmentRowLengths.value.spacing),
    SEGMENT_ROW_LENGTH: computed(() => segmentRowLengths.value.total),

    // прямые константы (для удобства можно оставить как ссылки на config.value)
    BASE_ITEM_ROTATION: computed(() => config.value.baseItemRotation),
    BASE_SEGMENTS_ZPOS: computed(() => config.value.baseSegmentsZpos),
    ITEMS_REMOVING_ZPOS: computed(() => config.value.itemsRemovingZpos),
    BASE_SEGMENT_DIFFICULTY_STEP: computed(
      () => config.value.baseSegmentDifficultyStep,
    ),
    BASE_COIN_VALUE: computed(() => config.value.baseCoinValue),
    COIN_SPAWN_PROBABILITIES: computed(
      () => config.value.coinSpawnProbabilities,
    ),
    BOOSTER_SPAWN_PROBABILITIES: computed(
      () => config.value.boosterSpawnProbabilities,
    ),
    GRAVITY: computed(() => config.value.physics.gravity),
    FRICTION: computed(() => config.value.physics.friction),
    BOUNCE_FACTOR: computed(() => config.value.physics.bounceFactor),
    EXPLOSION_FORCE: computed(() => config.value.physics.explosionForce),
    EXPLOSION_UPWARD: computed(() => config.value.physics.explosionUpward),
    COLLISION_FACTOR: computed(() => config.value.physics.collisionFactor),
    REMOVAL_HEIGHT: computed(() => config.value.physics.removalHeight),
    DESTROYED_ROLLDROP_WEIGHTS: computed(
      () => config.value.destroyedRolldropWeights,
    ),
    DANGER_DISTANCE: computed(() => config.value.dangerDistance),
    COLLISION_COOLDOWN_MS: computed(() => config.value.collisionCooldownMs),
    BULLET_DEFAULT_SPEED: computed(() => config.value.bulletDefaultSpeed),
    BULLET_DEFAULT_MATERIAL: computed(() => config.value.bulletDefaultMaterial),
    BULLET_MAX_DISTANCE: computed(() => config.value.bulletMaxDistance),

    FLASH_SIZE_DEFAULT: computed(() => config.value.flashSizeDefault),
    EXPLOSION_SIZE_DEFAULT: computed(() => config.value.explosionSizeDefault),
    FLASH_DURATION_DEFAULT: computed(() => config.value.flashDurationDefault),
    EXPLOSION_DURATION_DEFAULT: computed(
      () => config.value.explosionDurationDefault,
    ),
    JUMP_WIDTH: computed(() => config.value.jumpWidth),
    JUMP_HEIGHT: computed(() => config.value.jumpHeight),
    JUMP_DEPTH: computed(() => config.value.jumpDepth),
    MOVING_OBSTACLE_SPEED: computed(() => config.value.movingObstacleSpeed),

    BASE_CUBE_MATERIAL_CONFIG: computed(() => config.value.materials.base),

    MAGNET_MATERIAL_CONFIG: computed(() => config.value.materials.magnet),
    NITRO_MATERIAL_CONFIG: computed(() => config.value.materials.nitro),
    SHIELD_MATERIAL_CONFIG: computed(() => config.value.materials.shield),
    BULLET_MATERIAL_CONFIG: computed(() => config.value.materials.bullet),
    GOLDEN_MATERIAL_CONFIG: computed(() => config.value.materials.golden),

    // методы
    getBasePhysics,
    getBulletGeometry: () => config.value.bulletGeometry,
  };
});
