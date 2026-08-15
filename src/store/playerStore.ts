import * as THREE from "three";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useProgressStore } from "@/store/progressStore";
import { useMetaStore } from "@/store/metaStore";
import { useCommonStore } from "@/store/commonStore";
import { useLevelStore } from "@/store/levelStore";
import playerConfig from "@/configs/player";
import type {
  GameplayConfig,
  NitroTrailVisualConfig,
  ShieldVisualConfig,
} from "@/levels/types";

const DEFAULT_NITRO_TRAIL: NitroTrailVisualConfig = {
  color: "#66ff66",
  width: 2.2,
  height: 0.8,
  offsetX: 0.85,
  offsetY: 0.25,
  offsetZ: 2,
  timeScale: 4,
};

const DEFAULT_SHIELD: ShieldVisualConfig = {
  color: "#55dfff",
  radius: 3,
  offsetY: 0.55,
  offsetZ: -3,
  scaleX: 1.15,
  scaleY: 0.9,
  scaleZ: 0.9,
  opacity: 0.1,
  timeScale: 1.8,
};

export type MagnetMode = "pull" | "lethalPull" | "repulse";

export const usePlayerStore = defineStore("playerStore", () => {
  const progressStore = useProgressStore();
  const metaStore = useMetaStore();
  const commonStore = useCommonStore();
  const levelStore = useLevelStore();
  const config = ref(playerConfig);
  const renderInstance = ref();

  const cols = computed(() =>
    config.value.getCols(commonStore.config.xzScaling),
  );
  const rows = computed(() =>
    config.value.getRows(commonStore.config.xzScaling),
  );
  const height = computed(() =>
    config.value.getHeight(commonStore.baseItemYpos),
  );
  const glbScales = computed(() =>
    config.value.getGlbScales(commonStore.config.xzScaling),
  );
  const carCubesConfig = computed(() =>
    config.value.getCarCubesConfig(
      cols.value,
      rows.value,
      height.value,
      glbScales.value,
    ),
  );
  const currentPlayerConfig = computed(() => levelStore.currentLevel.player);
  const currentPlayerVisual = computed(() => currentPlayerConfig.value.visual);
  const carEmissionConfigExtra = computed(() => ({
    ...config.value.carEmissionConfigExtra,
    ...currentPlayerVisual.value?.emissiveColors,
  }));
  const defaultEmissionIntensity = computed(
    () =>
      currentPlayerVisual.value?.defaultEmissionIntensity ??
      config.value.defaultEmissionIntensity,
  );
  const defaultBlinkDuration = computed(
    () =>
      currentPlayerVisual.value?.defaultBlinkDuration ??
      config.value.defaultBlinkDuration,
  );
  const defaultBlinkSpeed = computed(
    () =>
      currentPlayerVisual.value?.defaultBlinkSpeed ??
      config.value.defaultBlinkSpeed,
  );
  const nitroTrailConfig = computed(() => ({
    ...DEFAULT_NITRO_TRAIL,
    ...currentPlayerVisual.value?.nitroTrail,
  }));
  const shieldConfig = computed(() => ({
    ...DEFAULT_SHIELD,
    ...currentPlayerVisual.value?.shield,
  }));

  const startSpeed = ref(config.value.baseSpeed);
  const speed = ref(config.value.baseSpeed);
  const baseSpeed = ref(config.value.baseSpeed);
  const maxSpeed = ref(config.value.maxSpeed);
  const acceleration = ref(config.value.acceleration);
  const accelerationType = ref<"exponential" | "logarithmic">("logarithmic");
  const forceJump = ref(false);
  const isMassEnabled = ref(true);
  const extraTemporaryMass = ref(0);
  const corruptedNitroMass = ref(0);
  const corruptedNitroEnabled = ref(false);

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
  const magnetMode = ref<MagnetMode>("pull");

  const isShieldEnabled = ref(false);
  const corruptedShieldEnabled = ref(false);
  const shieldBlindnessTimer = ref(0);
  const armor = ref(0);
  const maxArmor = computed(() => metaStore.maxArmor);

  const ammo = ref(0);
  const maxAmmo = computed(() => metaStore.maxAmmo);
  const bodyMass = computed(() =>
    carCubesConfig.value.reduce((sum, cube) => {
      const [sx, sy, sz] = cube.scale;
      return sum + sx * sy * sz * config.value.mass.cubeDensity;
    }, 0),
  );
  const cargoMass = computed(
    () =>
      armor.value * config.value.mass.armorUnitMass +
      ammo.value * config.value.mass.ammoUnitMass,
  );
  const temporaryMass = computed(
    () => extraTemporaryMass.value + corruptedNitroMass.value,
  );
  const mass = computed(
    () => bodyMass.value + cargoMass.value + temporaryMass.value,
  );
  const maxMass = computed(
    () => bodyMass.value * (1 + config.value.mass.maxExtraMassRatio),
  );
  const massRatio = computed(() =>
    bodyMass.value > 0 ? mass.value / bodyMass.value : 1,
  );
  const cargoMassRatio = computed(() => Math.max(0, massRatio.value - 1));

  const currentLane = ref(1);
  const carPosition = ref({ x: 0, y: 0, z: 0 });
  const cameraPosition = ref({ x: 0, y: 0, z: 0 });

  const notificationMsg = ref("");
  const eventType = ref("");
  const eventCounter = ref(0);

  function applyGameplayConfig(gameplay: GameplayConfig) {
    startSpeed.value = gameplay.startSpeed;
    maxSpeed.value = gameplay.maxSpeed;
    acceleration.value = gameplay.speedIncreaseRate;

    if (
      baseSpeed.value < startSpeed.value ||
      baseSpeed.value === config.value.baseSpeed
    ) {
      baseSpeed.value = startSpeed.value;
    }

    if (
      speed.value < startSpeed.value ||
      speed.value === config.value.baseSpeed
    ) {
      speed.value = startSpeed.value;
    }
  }

  watch(
    () => levelStore.currentGameplay,
    (gameplay) => {
      applyGameplayConfig(gameplay);
    },
    { immediate: true },
  );

  function resetPlayerAchievements() {
    disableShield();
    disableNitro();
    disableMagnet();
    resetMass();
    shieldBlindnessTimer.value = 0;
  }

  function enableNitro(corrupted = false) {
    if (!isNitroEnabled.value) {
      progressStore.riseMultiplier(2, "multiply");
    }
    isNitroEnabled.value = true;
    nitroTimer.value = config.value.nitro.baseTimer;
    corruptedNitroEnabled.value = corrupted;
    corruptedNitroMass.value =
      corrupted && isMassEnabled.value
        ? getClampedTemporaryMass(config.value.mass.corruptedNitroMass)
        : 0;
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
    corruptedNitroEnabled.value = false;
    corruptedNitroMass.value = 0;
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

  function enableMagnet(types: any[], mode: MagnetMode = "pull") {
    isMagnetEnabled.value = true;
    magnetTimer.value = config.value.magnet.baseTimer;
    magnetTypes.value = types;
    magnetMode.value = mode;
  }

  function disableMagnet() {
    isMagnetEnabled.value = false;
    magnetTimer.value = config.value.magnet.baseTimer;
    magnetTypes.value = [];
    magnetMode.value = "pull";
  }

  function addArmor(): void {
    if (armor.value < maxArmor.value) armor.value += 1;
  }

  function reduceShield() {
    if (armor.value > 0) armor.value -= 1;
  }

  function enableShield(corrupted = false) {
    isShieldEnabled.value = true;
    corruptedShieldEnabled.value = corrupted;
  }

  function disableShield() {
    isShieldEnabled.value = false;
    corruptedShieldEnabled.value = false;
  }

  function triggerShieldBlindness(duration = 900) {
    shieldBlindnessTimer.value = Math.max(shieldBlindnessTimer.value, duration);
  }

  function updateStatusEffects(delta: number) {
    if (shieldBlindnessTimer.value > 0) {
      shieldBlindnessTimer.value = Math.max(
        0,
        shieldBlindnessTimer.value - delta,
      );
    }
  }

  function resetGameData() {
    baseSpeed.value = startSpeed.value;
    speed.value = startSpeed.value;
    isNitroEnabled.value = false;
    corruptedNitroEnabled.value = false;
    corruptedShieldEnabled.value = false;
    shieldBlindnessTimer.value = 0;
    resetMass();
    currentLane.value = 1;
  }

  function addMass(amount: number) {
    extraTemporaryMass.value = getClampedTemporaryMass(
      extraTemporaryMass.value + amount,
    );
  }

  function resetMass() {
    extraTemporaryMass.value = 0;
    corruptedNitroMass.value = 0;
  }

  function getClampedTemporaryMass(amount: number) {
    const maxTemporaryMass = Math.max(
      0,
      maxMass.value - bodyMass.value - cargoMass.value,
    );
    return Math.max(0, Math.min(maxTemporaryMass, amount));
  }

  function getMassPenalty() {
    if (!isMassEnabled.value) return 0;
    return cargoMassRatio.value;
  }

  function getControlMultiplier() {
    if (!isMassEnabled.value) return 1;

    const massPenalty =
      getMassPenalty() * config.value.mass.controlPenaltyPerMassRatio;
    const nitroPenalty = corruptedNitroEnabled.value
      ? config.value.mass.corruptedNitroControlPenalty
      : 0;

    return Math.max(
      config.value.mass.minControlMultiplier,
      1 - massPenalty - nitroPenalty,
    );
  }

  function getJumpMultiplier() {
    if (!isMassEnabled.value) return 1;

    return Math.max(
      config.value.mass.minJumpMultiplier,
      1 - getMassPenalty() * config.value.mass.jumpPenaltyPerMassRatio,
    );
  }

  function getSpeedMassMultiplier() {
    if (!isMassEnabled.value) return 1;

    return Math.max(
      config.value.mass.minSpeedMultiplier,
      1 - getMassPenalty() * config.value.mass.speedPenaltyPerMassRatio,
    );
  }

  function getCurrentSpeed() {
    const curSpeed = baseSpeed.value * nitroMultiplierCurrent.value;
    return Math.min(curSpeed, maxSpeed.value) * getSpeedMassMultiplier();
  }

  function getCurrentSpeedInCubesPerHour(precision = 2) {
    return (getCurrentSpeed() * 3600).toFixed(precision);
  }

  function getCurrentAcceleration() {
    const currentSpeed = getCurrentSpeed();
    const ratio = currentSpeed / maxSpeed.value;
    if (accelerationType.value === "exponential") {
      return acceleration.value * (1 - ratio);
    }
    const logFactor = maxSpeed.value / (currentSpeed + 1);
    return (
      acceleration.value * logFactor * (1 - ratio) * getSpeedMassMultiplier()
    );
  }

  function setAccelerationType(type: "exponential" | "logarithmic") {
    accelerationType.value = type;
  }

  function setMassEnabled(enabled: boolean) {
    isMassEnabled.value = enabled;
    if (!enabled) resetMass();
  }

  function toggleMassEnabled() {
    setMassEnabled(!isMassEnabled.value);
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
      laneChangeSpeed: config.value.laneChangeSpeed * getControlMultiplier(),
      maxTilt: config.value.maxTilt,
      tiltSmoothing: config.value.tiltSmoothing,
      lateralAcceleration:
        config.value.mass.lateralAcceleration * getControlMultiplier(),
      lateralDamping: config.value.mass.lateralDamping,
    };
  }

  function getJumpOptions() {
    return {
      jumpHeight: config.value.jumpHeight * getJumpMultiplier(),
    };
  }

  function getNitroTrailConfig(): NitroTrailVisualConfig {
    return nitroTrailConfig.value;
  }

  function getShieldConfig(): ShieldVisualConfig {
    return shieldConfig.value;
  }

  function getDefaultCarConfig() {
    return {
      startLane: 2,
      startPosition: new THREE.Vector3(0, commonStore.baseItemYpos, 0),
      ...getColliderOptions(),
      ...getRuleOptions(),
      ...getJumpOptions(),
    };
  }

  return {
    config,
    CAR_CUBES_CONFIG: carCubesConfig,
    CAR_MATERIAL_CONFIG: config.value.carMaterialConfig,
    CAR_MATERIAL_CONFIG_EXTRA: config.value.carMaterialConfigExtra,
    CAR_EMISSION_CONFIG_EXTRA: carEmissionConfigExtra,
    NITRO_MULTIPLIER: config.value.nitro.multiplier,
    BASE_NITRO_TIMER: config.value.nitro.baseTimer,
    BASE_MAGNET_TIMER: config.value.magnet.baseTimer,
    BASE_SPEED: config.value.baseSpeed,
    FORCED_JUMP_MULTIPLIER: config.value.forcedJumpMultiplier,
    JUMP_HEIGHT: config.value.jumpHeight,
    DEFAULT_EMISSION_INTENSITY: defaultEmissionIntensity,
    DEFAULT_BLINK_DURATION: defaultBlinkDuration,
    DEFAULT_BLINK_SPEED: defaultBlinkSpeed,
    speed,
    startSpeed,
    baseSpeed,
    isNitroEnabled,
    corruptedNitroEnabled,
    isShieldEnabled,
    corruptedShieldEnabled,
    shieldBlindnessTimer,
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
    magnetMode,
    forceJump,
    isMassEnabled,
    mass,
    maxMass,
    bodyMass,
    cargoMass,
    temporaryMass,
    corruptedNitroMass,
    massRatio,
    resetPlayerAchievements,
    enableNitro,
    disableNitro,
    updateNitro,
    updateStatusEffects,
    enableShield,
    triggerShieldBlindness,
    disableShield,
    enableMagnet,
    disableMagnet,
    addMass,
    resetMass,
    getControlMultiplier,
    getJumpMultiplier,
    setMassEnabled,
    toggleMassEnabled,
    getRuleOptions,
    getJumpOptions,
    resetGameData,
    applyGameplayConfig,
    getCurrentSpeed,
    getCurrentSpeedInCubesPerHour,
    getCurrentAcceleration,
    setAccelerationType,
    getNitroTrailConfig,
    getShieldConfig,
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
