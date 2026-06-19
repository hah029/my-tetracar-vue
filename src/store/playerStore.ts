import * as THREE from "three";
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useProgressStore } from "@/store/progressStore";
import { useMetaStore } from "@/store/metaStore";
import { useCommonStore } from "@/store/commonStore";
import playerConfig from "@/configs/player";

export const usePlayerStore = defineStore("playerStore", () => {
  const progressStore = useProgressStore();
  const metaStore = useMetaStore();
  const commonStore = useCommonStore();
  const config = ref(playerConfig); // реактивный конфиг

  const renderInstance = ref();

  // Вычисляемые геометрические параметры
  const cols = computed(() => config.value.getCols(commonStore.XZ_SCALING));
  const rows = computed(() => config.value.getRows(commonStore.XZ_SCALING));
  const height = computed(() =>
    config.value.getHeight(commonStore.BASE_ITEM_YPOS),
  );
  const glbScales = computed(() =>
    config.value.getGlbScales(commonStore.XZ_SCALING),
  );
  const carCubesConfig = computed(() =>
    config.value.getCarCubesConfig(
      cols.value,
      rows.value,
      height.value,
      glbScales.value,
    ),
  );

  // Состояние
  const speed = ref(config.value.baseSpeed);
  const baseSpeed = ref(config.value.baseSpeed);
  const maxSpeed = ref(config.value.maxSpeed);
  const acceleration = ref(config.value.acceleration);
  const accelerationType = ref<"exponential" | "logarithmic">("logarithmic");
  const forceJump = ref(false);

  const isNitroEnabled = ref(false);
  const nitroTimer = ref(config.value.nitro.baseTimer);
  const goldenNitroMultiplier = ref(2);
  const energonNitroMultiplier = ref(2);
  const nitroMultiplierCurrent = ref(1);
  const nitroMultiplierTarget = ref(1);

  const isMagnetEnabled = ref(false);
  const magnetTimer = ref(config.value.magnet.baseTimer);
  const magnetRadius = computed(() => metaStore.magnetRadius);
  const magnetForce = ref(config.value.magnet.force);
  const magnetMaxTargets = ref(config.value.magnet.maxTargets);
  const magnetTypes = ref([] as any[]);

  const isShieldEnabled = ref(false);
  const armor = ref(0);
  const maxArmor = computed(() => metaStore.maxArmor);

  const ammo = ref(0);
  const maxAmmo = computed(() => metaStore.maxAmmo);

  const currentLane = ref(1);
  const carPosition = ref({ x: 0, y: 0, z: 0 });
  const cameraPosition = ref({ x: 0, y: 0, z: 0 });

  const notificationMsg = ref("");
  const eventType = ref("");
  const eventCounter = ref(0);

  // Вспомогательные функции, использующие конфиг
  function resetPlayerAchievements() {
    disableShield();
    disableNitro();
    disableMagnet();
  }

  function enableNitro() {
    if (!isNitroEnabled.value) {
      progressStore.riseMultiplier(2, "multiply");
    }
    isNitroEnabled.value = true;
    nitroMultiplierTarget.value = config.value.nitro.multiplier;
    if (renderInstance.value != null) {
      renderInstance.value.setAfterImagePassAmount(
        config.value.nitro.afterImagePass,
      );
      renderInstance.value.setRGBShiftAmount(config.value.nitro.rgbShift);
    }
  }

  function disableNitro() {
    isNitroEnabled.value = false;
    nitroTimer.value = config.value.nitro.baseTimer;
    nitroMultiplierTarget.value = 1;
    if (progressStore.currentMultiplier != 1) {
      progressStore.reduceMultiplier(2);
    }
    if (renderInstance.value != null) {
      renderInstance.value.setAfterImagePassAmount(0);
      renderInstance.value.setRGBShiftAmount(0);
    }
  }

  function updateNitro(delta: number) {
    const transitionSpeed =
      nitroMultiplierCurrent.value < nitroMultiplierTarget.value
        ? config.value.nitro.accelInSpeed
        : config.value.nitro.accelOutSpeed;
    nitroMultiplierCurrent.value = THREE.MathUtils.lerp(
      nitroMultiplierCurrent.value,
      nitroMultiplierTarget.value,
      delta * transitionSpeed,
    );
  }

  function enableMagnet(types: any[]) {
    isMagnetEnabled.value = true;
    magnetTypes.value = types;
  }

  function disableMagnet() {
    isMagnetEnabled.value = false;
    magnetTimer.value = config.value.magnet.baseTimer;
    magnetTypes.value = [];
  }

  function addArmor(): void {
    if (armor.value < maxArmor.value) armor.value += 1;
  }

  function reduceShield() {
    if (armor.value > 0) armor.value -= 1;
  }

  function enableShield() {
    isShieldEnabled.value = true;
  }

  function disableShield() {
    isShieldEnabled.value = false;
  }

  function resetGameData() {
    baseSpeed.value = config.value.baseSpeed;
    speed.value = config.value.baseSpeed;
    isNitroEnabled.value = false;
    currentLane.value = 1;
  }

  function getCurrentSpeed() {
    const curSpeed = baseSpeed.value * nitroMultiplierCurrent.value;
    return Math.min(curSpeed, maxSpeed.value);
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
      const logFactor = maxSpeed.value / (currentSpeed + 1);
      return acceleration.value * logFactor * (1 - ratio);
    }
  }

  function setAccelerationType(type: "exponential" | "logarithmic") {
    accelerationType.value = type;
  }

  function addAmmo(): void {
    if (ammo.value < maxAmmo.value) ammo.value += 1;
  }

  function consumeAmmo() {
    if (ammo.value > 0) ammo.value -= 1;
  }

  function canShoot(): boolean {
    return ammo.value > 0;
  }

  function makeEventHappened(type_: string) {
    eventType.value = type_;
    eventCounter.value++;
    setTimeout(() => {
      eventType.value = "";
    }, 1000);
  }

  function addNewMsg(msg_: string) {
    notificationMsg.value = msg_;
  }

  function getColliderOptions() {
    return {
      colliderShrinkX: config.value.collider.shrinkX,
      colliderShrinkZ: config.value.collider.shrinkZ,
      colliderYOffset: config.value.collider.yOffset,
      colliderHeightFactor: config.value.collider.heightFactor,
    };
  }

  function getRuleOptions() {
    return {
      laneChangeSpeed: config.value.laneChangeSpeed,
      maxTilt: config.value.maxTilt,
      tiltSmoothing: config.value.tiltSmoothing,
    };
  }

  function getJumpOptions() {
    return {
      jumpHeight: config.value.jumpHeight,
    };
  }

  function getDefaultCarConfig() {
    return {
      startLane: 2,
      startPosition: new THREE.Vector3(0, commonStore.BASE_ITEM_YPOS, 0),
      ...getColliderOptions(),
      ...getRuleOptions(),
      ...getJumpOptions(),
    };
  }

  return {
    // конфиг (при необходимости)
    config,

    // вычисляемые конфигурации
    CAR_CUBES_CONFIG: carCubesConfig,
    CAR_MATERIAL_CONFIG: config.value.carMaterialConfig,
    CAR_MATERIAL_CONFIG_EXTRA: config.value.carMaterialConfigExtra,
    CAR_EMISSION_CONFIG_EXTRA: config.value.carEmissionConfigExtra,

    // константы для совместимости (можно оставить для удобства)
    NITRO_MULTIPLIER: config.value.nitro.multiplier,
    BASE_NITRO_TIMER: config.value.nitro.baseTimer,
    BASE_MAGNET_TIMER: config.value.magnet.baseTimer,
    BASE_SPEED: config.value.baseSpeed,
    FORCED_JUMP_MULTIPLIER: config.value.forcedJumpMultiplier,
    JUMP_HEIGHT: config.value.jumpHeight,
    DEFAULT_EMISSION_INTENSITY: config.value.defaultEmissionIntensity,
    DEFAULT_BLINK_DURATION: config.value.defaultBlinkDuration,
    DEFAULT_BLINK_SPEED: config.value.defaultBlinkSpeed,

    // состояние
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

    // методы
    resetPlayerAchievements,
    enableNitro,
    disableNitro,
    updateNitro,
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

    renderInstance,
  };
});
