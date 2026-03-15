import { defineStore } from "pinia";
import { ref } from "vue";

export const usePlayerStore = defineStore("playerStore", () => {
  // ---- Основные константы ----
  // const BASE_SPEED = 2.0;
  const BASE_SPEED = 0.02; // м/с
  const NITRO_MULTIPLIER = 1.5;
  const MAX_SPEED = 1.0; // м/с
  const ACCELERATION = 1e-5;
  const BASE_NITRO_TIMER = 5000;
  // speed
  const speed = ref(BASE_SPEED);
  const baseSpeed = ref(BASE_SPEED);
  const maxSpeed = ref(MAX_SPEED);
  const acceleration = ref(ACCELERATION);
  const accelerationType = ref<"exponential" | "logarithmic">("exponential");
  // nitro
  const isNitroEnabled = ref(false);
  const nitroTimer = ref(BASE_NITRO_TIMER);
  const goldNitroMultiplier = ref(2);
  const diamondNitroMultiplier = ref(2);
  // nitro
  const isShieldEnabled = ref(false);
  //ammo
  const ammo = ref(100);
  const maxAmmo = ref(100);
  // position
  const currentLane = ref(1); // 0..3 для полос
  const carPosition = ref({ x: 0, y: 0, z: 0 });
  const cameraPosition = ref({ x: 0, y: 0, z: 0 });

  function enableNitro() {
    isNitroEnabled.value = true;
  }

  function disableNitro() {
    isNitroEnabled.value = false;
    nitroTimer.value = BASE_NITRO_TIMER;
  }

  function enableShield() {
    isShieldEnabled.value = true;
  }

  function disableShield() {
    isShieldEnabled.value = false;
  }

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

  function addAmmo(): void {
    if (ammo.value < maxAmmo.value) ammo.value += 1;
  }
  function consumeAmmo() {
    if (ammo.value > 0) ammo.value -= 1;
  }
  function canShoot(): boolean {
    return ammo.value > 0;
  }

  return {
    // states
    // NITRO_MULTIPLIER,
    BASE_NITRO_TIMER,
    BASE_SPEED,
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
    ammo,
    maxAmmo,
    goldNitroMultiplier,
    diamondNitroMultiplier,

    // methods
    enableNitro,
    disableNitro,

    enableShield,
    disableShield,

    resetGameData,
    getCurrentSpeed,
    getCurrentSpeedInCubesPerHour,
    getCurrentAcceleration,
    setAccelerationType,

    addAmmo,
    consumeAmmo,
    canShoot,
  };
});
