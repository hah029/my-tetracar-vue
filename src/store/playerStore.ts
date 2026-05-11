import * as THREE from "three";

import { defineStore } from "pinia";
import { ref } from "vue";
import { useProgressStore } from "@/store/progressStore";
import { useCommonStore } from "@/store/commonStore";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import type { TextureMap } from "@/game/car/CarVisualState";

export const usePlayerStore = defineStore("playerStore", () => {
  // #region - основные константы
  const progressStore = useProgressStore();
  const commonStore = useCommonStore();

  const COLS: [number, number, number] = [
    -commonStore.XZ_SCALING * 2,
    0,
    commonStore.XZ_SCALING * 2,
  ];
  const ROWS: [number, number, number, number] = [
    commonStore.XZ_SCALING * 3,
    commonStore.XZ_SCALING,
    -commonStore.XZ_SCALING,
    -commonStore.XZ_SCALING * 3,
  ];
  const HEIGHT = commonStore.BASE_ITEM_YPOS;
  const GLB_SCALES: [number, number, number] = [
    commonStore.XZ_SCALING,
    commonStore.XZ_SCALING,
    commonStore.XZ_SCALING,
  ];
  const CAR_CUBES_CONFIG: GeometryConfig[] = [
    {
      pos: [COLS[1], HEIGHT, ROWS[3]],
      scale: GLB_SCALES,
      name: "shield",
      modelUrl: commonStore.cubeUrl,
    },

    {
      pos: [COLS[1], HEIGHT, ROWS[2]],
      scale: GLB_SCALES,
      name: "default",
      modelUrl: commonStore.cubeUrl,
    },

    {
      pos: [COLS[1], HEIGHT, ROWS[1]],
      scale: GLB_SCALES,
      name: "default",
      modelUrl: commonStore.cubeUrl,
    },
    // передние колеса
    {
      pos: [COLS[0], HEIGHT, ROWS[0]],
      scale: GLB_SCALES,
      name: "nitro",
      modelUrl: commonStore.cubeUrl,
    },
    {
      pos: [COLS[2], HEIGHT, ROWS[0]],
      scale: GLB_SCALES,
      name: "nitro",
      modelUrl: commonStore.cubeUrl,
    },
    // передние колеса
    {
      pos: [COLS[2], HEIGHT, ROWS[2]],
      scale: GLB_SCALES,
      name: "nitro",
      modelUrl: commonStore.cubeUrl,
    },
    {
      pos: [COLS[0], HEIGHT, ROWS[2]],
      scale: GLB_SCALES,
      name: "nitro",
      modelUrl: commonStore.cubeUrl,
    },
  ];
  const CAR_MATERIAL_CONFIG: MaterialConfig = {
    textureUrl: commonStore.base_texture,
  };

  const CAR_MATERIAL_CONFIG_EXTRA: TextureMap = {
    default: commonStore.base_texture,
    nitro: commonStore.nitro_texture,
    shield: commonStore.shield_texture,
    damage: commonStore.damage_texture,
  };

  const CAR_EMISSION_CONFIG_EXTRA = {
    default: 0x000000,
    nitro: 0x005500,
    shield: 0x555555,
    damage: 0x550000,
  };

  const BASE_SPEED = 0.05; // м/с - стартовая скорость машинки
  const MAX_SPEED = 1.0; // м/с - максимальная скорость машинки
  const NITRO_MULTIPLIER = 1.5;
  const ACCELERATION = 0.0000005; // - темп ускорения машинки
  const FORCED_JUMP_MULTIPLIER = 10;
  // size + collider
  const COLLIDER_SHRINK_X = 1.0;
  const COLLIDER_SHRINK_Z = 1.0;
  const COLLIDER_Y_OFFSET = 0.0;
  const COLLIDER_HEIGHT_FACTOR = 0.8;
  //
  const LANE_CHANGE_SPEED = 0.3;
  const MAX_TILT = 0.08;
  const TILT_SMOOTHING = 0.2;
  // jumps
  const JUMP_HEIGHT = 8.0;
  const JUMP_DURATION = 0.2;

  const DEFAULT_EMISSION_INTENSITY = 1.2;
  const DEFAULT_BLINK_DURATION = 1;
  const DEFAULT_BLINK_SPEED = 10;

  // speed
  const speed = ref(BASE_SPEED);
  const baseSpeed = ref(BASE_SPEED);
  const maxSpeed = ref(MAX_SPEED);
  const acceleration = ref(ACCELERATION);
  const accelerationType = ref<"exponential" | "logarithmic">("logarithmic");
  const forceJump = ref(false);

  // nitro
  const BASE_NITRO_TIMER = 5000;
  const isNitroEnabled = ref(false);
  const nitroTimer = ref(BASE_NITRO_TIMER);
  const goldenNitroMultiplier = ref(2);
  const energonNitroMultiplier = ref(2);
  // magnet
  const BASE_MAGNET_TIMER = 10000;
  const isMagnetEnabled = ref(false);
  const magnetTimer = ref(BASE_MAGNET_TIMER);
  const magnetRadius = ref(10);
  const magnetForce = ref(10);
  const magnetMaxTargets = ref(8);
  const magnetTypes = ref([] as any[]);

  // armor
  const isShieldEnabled = ref(false);
  const armor = ref(0);
  const maxArmor = ref(5);

  //ammo
  const ammo = ref(0);
  const maxAmmo = ref(5);

  // position
  const currentLane = ref(1); // 0..3 для полос
  const carPosition = ref({ x: 0, y: 0, z: 0 });
  const cameraPosition = ref({ x: 0, y: 0, z: 0 });

  // быстрые сообщения
  const notificationMsg = ref("");
  const eventType = ref("");
  const eventCounter = ref(0);
  // #endregion

  // сбрасываем все бустеры игрока при поражении / выходе из игры
  function resetPlayerAchievements() {
    ammo.value = 0;
    armor.value = 0;
    disableShield();
    disableNitro();
    disableMagnet();
    console.log("all boosters reseted");
  }

  // #region - работаем с нитро
  // включаем нитро
  function enableNitro() {
    isNitroEnabled.value = true;
    if (!isNitroEnabled.value) progressStore.riseMultiplier(2, "multiply");
  }
  // отключаем нитро
  function disableNitro() {
    isNitroEnabled.value = false;
    nitroTimer.value = BASE_NITRO_TIMER;
    if (progressStore.currentMultiplier != 1) progressStore.reduceMultiplier(2);
  }
  // #endregion

  // #region - работаем с нитро
  // включаем нитро
  function enableMagnet(types: any[]) {
    isMagnetEnabled.value = true;
    magnetTypes.value = types;
  }
  // отключаем нитро
  function disableMagnet() {
    isMagnetEnabled.value = false;
    magnetTimer.value = BASE_MAGNET_TIMER;
    magnetTypes.value = [];
  }
  // #endregion

  // #region - работаем с броней
  // добавляем кол-во брони (после поимки)
  function addArmor(): void {
    if (armor.value < maxArmor.value) armor.value += 1;
  }

  // уменьшаем кол-во брони (после выстрела)
  function reduceShield() {
    if (armor.value > 0) armor.value -= 1;
  }

  // включаем броню
  function enableShield() {
    isShieldEnabled.value = true;
  }

  // отключаем броню
  function disableShield() {
    isShieldEnabled.value = false;
  }
  // #endregion

  // #region - работаем со скоростью и ускорением
  function resetGameData() {
    baseSpeed.value = BASE_SPEED;
    speed.value = BASE_SPEED;
    isNitroEnabled.value = false;
    currentLane.value = 1;
  }

  function getCurrentSpeed() {
    let multiplier = 1.0;
    if (isNitroEnabled.value) {
      multiplier = NITRO_MULTIPLIER;
    }
    let curSpeed = baseSpeed.value * multiplier;
    if (curSpeed > maxSpeed.value) {
      return maxSpeed.value;
    }
    return curSpeed;
  }

  function getCurrentSpeedInCubesPerHour(precision = 2) {
    return (getCurrentSpeed() * 3600).toFixed(precision);
  }

  function getCurrentAcceleration() {
    const currentSpeed = getCurrentSpeed();
    const ratio = currentSpeed / maxSpeed.value;
    if (accelerationType.value === "exponential") {
      return acceleration.value * (1 - ratio);
    } else {
      // Логарифмическая модель: ускорение обратно пропорционально скорости
      // Формула: a = acceleration * (maxSpeed / (currentSpeed + 1)) * (1 - ratio)
      // Это обеспечивает более медленный рост на высоких скоростях
      const logFactor = maxSpeed.value / (currentSpeed + 1);
      return acceleration.value * logFactor * (1 - ratio);
    }
  }

  function setAccelerationType(type: "exponential" | "logarithmic") {
    accelerationType.value = type;
  }
  // #endregion

  // #region - работаем с патронами
  // добавляем кол-во патронов (после поимки)
  function addAmmo(): void {
    if (ammo.value < maxAmmo.value) ammo.value += 1;
  }

  // уменьшаем кол-во патронов (после выстрела)
  function consumeAmmo() {
    if (ammo.value > 0) ammo.value -= 1;
  }

  // проверка на наличие патронов в обойме
  function canShoot(): boolean {
    return ammo.value > 0;
  }
  // #endregion

  // #region - работаем с событиями и сообщениями
  // ловим тип события (поймал патрон, броню, нитро или энергон)
  function makeEventHappened(type_) {
    eventType.value = type_;
    eventCounter.value++;
    setTimeout(() => {
      eventType.value = "";
    }, 1000);
  }

  // сохраняем новое сообщение в Store
  function addNewMsg(msg_) {
    notificationMsg.value = msg_;
  }

  function getColliderOptions() {
    return {
      colliderShrinkX: COLLIDER_SHRINK_X,
      colliderShrinkZ: COLLIDER_SHRINK_Z,
      colliderYOffset: COLLIDER_Y_OFFSET,
      colliderHeightFactor: COLLIDER_HEIGHT_FACTOR,
    };
  }

  function getRuleOptions() {
    return {
      laneChangeSpeed: LANE_CHANGE_SPEED,
      maxTilt: MAX_TILT,
      tiltSmoothing: TILT_SMOOTHING,
    };
  }

  function getJumpOptions() {
    return {
      jumpHeight: JUMP_HEIGHT,
      jumpDuration: JUMP_DURATION,
    };
  }

  function getDefaultCarConfig() {
    // Позиционирование
    return {
      startLane: 2,
      startPosition: new THREE.Vector3(0, useCommonStore().BASE_ITEM_YPOS, 0),
      // Размеры и коллайдер
      ...getColliderOptions(),

      // // Управление
      ...getRuleOptions(),

      // // Прыжки
      ...getJumpOptions(),
    };
  }
  // #endregion

  return {
    // constants
    CAR_CUBES_CONFIG,
    CAR_MATERIAL_CONFIG,
    CAR_MATERIAL_CONFIG_EXTRA,
    CAR_EMISSION_CONFIG_EXTRA,

    NITRO_MULTIPLIER,
    BASE_NITRO_TIMER,
    BASE_MAGNET_TIMER,
    BASE_SPEED,
    FORCED_JUMP_MULTIPLIER,
    JUMP_HEIGHT,

    DEFAULT_EMISSION_INTENSITY,
    DEFAULT_BLINK_DURATION,
    DEFAULT_BLINK_SPEED,

    // states
    speed,
    baseSpeed,
    isNitroEnabled,
    isShieldEnabled,
    currentLane,
    maxSpeed,
    acceleration,
    accelerationType,
    carPosition,
    cameraPosition,
    nitroTimer,
    armor,
    maxArmor,
    ammo,
    maxAmmo,
    goldenNitroMultiplier,
    energonNitroMultiplier,
    notificationMsg,
    eventType,
    eventCounter,
    isMagnetEnabled,
    magnetTimer,
    magnetRadius,
    magnetForce,
    magnetMaxTargets,
    magnetTypes,
    forceJump,

    // methods
    resetPlayerAchievements,
    enableNitro,
    disableNitro,

    enableShield,
    disableShield,

    enableMagnet,
    disableMagnet,

    resetGameData,
    getCurrentSpeed,
    getCurrentSpeedInCubesPerHour,
    getCurrentAcceleration,
    setAccelerationType,

    addAmmo,
    consumeAmmo,
    addArmor,
    reduceShield,
    canShoot,
    makeEventHappened,
    addNewMsg,

    getDefaultCarConfig,
  };
});
