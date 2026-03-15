// src/store/gameState.ts
import { defineStore } from "pinia";
import { ref } from "vue";

import { usePlayerStore } from "./playerStore";
import { useProgressStore } from "./progressStore";
import { GameStates } from "@/game/core/GameState";

export const useGameState = defineStore("gameState", () => {
  // ---- Состояния ----
  const currentState = ref<GameStates>(GameStates.Preloader);
  const isDebug = ref(false);

  // ---- Actions ----
  function toggleDebug() {
    isDebug.value = !isDebug.value;
  }

  function setState(state: GameStates) {
    currentState.value = state;
  }

  function startGame() {
    setState(GameStates.Play);
    useProgressStore().score = 0;
    usePlayerStore().speed = 0;
  }

  function startCountdown() {
    currentState.value = GameStates.Countdown;
  }

  function pauseGame() {
    if (currentState.value === GameStates.Play) setState(GameStates.Pause);
  }

  function resumeGame() {
    if (currentState.value === GameStates.Pause) setState(GameStates.Play);
  }

  function endGame() {
    setState(GameStates.Gameover);
    useProgressStore().saveHighScore();
  }

  function goToMenu() {
    setState(GameStates.Menu);
  }

  return {
    currentState,
    isDebug,

    setState,
    startGame,
    startCountdown,
    pauseGame,
    resumeGame,
    endGame,
    goToMenu,
    toggleDebug,
  };
});
