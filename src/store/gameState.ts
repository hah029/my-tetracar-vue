// src/store/gameState.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { RoadManager } from "@/game/road";

import { usePlayerStore } from "./playerStore";

export const useGameState = defineStore("gameState", () => {
  // ---- Состояния ----
  const currentState = ref<
    "preloader" | "menu" | "playing" | "gameover" | "paused"
  >("preloader");
  const currentDistance = ref(0);
  const score = ref(0);
  const highScore = ref(0);

  // ---- Actions ----
  function setState(
    state: "preloader" | "menu" | "playing" | "gameover" | "paused",
  ) {
    currentState.value = state;
  }

  function startGame() {
    const playerStore = usePlayerStore();
    setState("playing");
    score.value = 0;
    playerStore.speed = 0;
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
    currentState,
    score,
    highScore,

    setState,
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
