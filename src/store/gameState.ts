// src/store/gameState.ts
import { defineStore } from "pinia";
import { ref } from "vue";

import { usePlayerStore } from "./playerStore";
import { useProgressStore } from "./progressStore";

export const useGameState = defineStore("gameState", () => {
  // ---- Состояния ----
  const currentState = ref<
    "preloader" | "menu" | "playing" | "gameover" | "paused"
  >("preloader");

  // ---- Actions ----
  function setState(
    state: "preloader" | "menu" | "playing" | "gameover" | "paused",
  ) {
    currentState.value = state;
  }

  function startGame() {
    setState("playing");
    useProgressStore().score = 0;
    usePlayerStore().speed = 0;
  }

  function pauseGame() {
    if (currentState.value === "playing") setState("paused");
  }

  function resumeGame() {
    if (currentState.value === "paused") setState("playing");
  }

  function endGame() {
    setState("gameover");
    useProgressStore().saveHighScore();
  }

  function goToMenu() {
    setState("menu");
  }

  return {
    currentState,

    setState,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    goToMenu,
  };
});
