// src/store/gameState.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { RoadManager } from "@/game/road";

export const useGameState = defineStore("gameState", () => {
  // ---- Основные константы ----
  // const BASE_SPEED = 2.0;
  const BASE_SPEED = 0.5;
  const NITRO_MULTIPLIER = 2.0;
  const MAX_SPEED = 3.0;
  const ACCELERATION = 0.001;

  // ---- Состояния ----
  const currentState = ref<"menu" | "playing" | "gameover" | "paused">("menu");
  const speed = ref(BASE_SPEED);
  const baseSpeed = ref(BASE_SPEED);
  const isNitroEnabled = ref(false);
  const currentLane = ref(1); // 0..3 для полос
  const maxSpeed = ref(MAX_SPEED);
  const acceleration = ref(ACCELERATION);
  const score = ref(0);
  const highScore = ref(0);
  const carPosition = ref({ x: 0, y: 0, z: 0 });
  const cameraPosition = ref({ x: 0, y: 0, z: 0 });

  // ---- Actions ----
  function setState(state: "menu" | "playing" | "gameover" | "paused") {
    currentState.value = state;
    // console.log("Current state: ", currentState.value)
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

  function getCurrentAcceleration() {
    return acceleration.value * (1 - getCurrentSpeed() / maxSpeed.value);
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
    BASE_SPEED,
    currentState,
    speed,
    baseSpeed,
    isNitroEnabled,
    currentLane,
    maxSpeed,
    acceleration,
    score,
    highScore,
    carPosition,
    cameraPosition,

    // actions
    setState,
    enableNitro,
    disableNitro,
    resetGameData,
    getCurrentSpeed,
    getCurrentAcceleration,
    addScore,
    resetScore,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    goToMenu,
    getDangerLevel,
    getLanesCount,
  };
});
