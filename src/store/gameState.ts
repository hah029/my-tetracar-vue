// src/store/gameState.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { RoadManager } from "@/game/road";

export const useGameState = defineStore("gameState", () => {
  // ---- Основные константы ----
  // const BASE_SPEED = 2.0;
  const BASE_SPEED = 0.02; // м/с
  const NITRO_MULTIPLIER = 1.5;
  const MAX_SPEED = 1.0; // м/с
  const ACCELERATION = 1e-5;
  const BASE_NITRO_TIMER = 5000;

  // ---- Состояния ----
  const currentState = ref<
    "preloader" | "menu" | "playing" | "gameover" | "paused"
  >("preloader");
  const speed = ref(BASE_SPEED);
  const baseSpeed = ref(BASE_SPEED);
  const isNitroEnabled = ref(false);
  const nitroTimer = ref(BASE_NITRO_TIMER);
  const currentLane = ref(1); // 0..3 для полос
  const currentDistance = ref(0);
  const maxSpeed = ref(MAX_SPEED);
  const acceleration = ref(ACCELERATION);
  const accelerationType = ref<"exponential" | "logarithmic">("exponential");
  const score = ref(0);
  const highScore = ref(0);
  const carPosition = ref({ x: 0, y: 0, z: 0 });
  const cameraPosition = ref({ x: 0, y: 0, z: 0 });

  // ---- Actions ----
  function setState(
    state: "preloader" | "menu" | "playing" | "gameover" | "paused",
  ) {
    currentState.value = state;
  }

  function startGame() {
    setState("playing");
    score.value = 0;
    speed.value = 0;
  }

  function pauseGame() {
    if (currentState.value === "playing") setState("paused");
  }

  function resumeGame() {
    if (currentState.value === "paused") setState("playing");
  }

  function endGame() {
    setState("gameover");
    if (score.value > highScore.value) highScore.value = score.value;
  }

  function goToMenu() {
    setState("menu");
  }

  function enableNitro() {
    isNitroEnabled.value = true;
  }

  function disableNitro() {
    isNitroEnabled.value = false;
    nitroTimer.value = BASE_NITRO_TIMER;
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

  function addScore(amount: number) {
    score.value += amount;
    if (score.value > highScore.value) highScore.value = score.value;
  }

  function resetScore() {
    score.value = 0;
  }

  function getDangerLevel() {
    return 0;
  }

  function resetDistance() {
    currentDistance.value = 0;
  }

  function addDistance(value: number) {
    currentDistance.value += value;
  }

  function getDistance(): number {
    return currentDistance.value;
  }

  function getDistanceInCubes(): number {
    return Math.floor(currentDistance.value);
  }

  function getLanesCount() {
    try {
      return RoadManager.getInstance().getLanesCount();
    } catch {
      return 4; // значение по умолчанию
    }
  }

  return {
    // state
    NITRO_MULTIPLIER,
    BASE_NITRO_TIMER,
    BASE_SPEED,
    currentState,
    speed,
    baseSpeed,
    isNitroEnabled,
    currentLane,
    maxSpeed,
    acceleration,
    accelerationType,
    score,
    highScore,
    carPosition,
    cameraPosition,
    nitroTimer,

    // actions
    setState,
    enableNitro,
    disableNitro,
    resetGameData,
    getCurrentSpeed,
    getCurrentSpeedInCubesPerHour,
    getCurrentAcceleration,
    setAccelerationType,
    addScore,
    resetScore,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    goToMenu,
    getDangerLevel,
    getLanesCount,

    addDistance,
    resetDistance,
    getDistance,
    getDistanceInCubes,
  };
});
