// src/store/gameState.ts
import { defineStore } from "pinia";
import { ref } from "vue";

import { usePlayerStore } from "./playerStore";
import { useProgressStore } from "./progressStore";

export enum GAME_STATES {
  PRELOADER,
  MENU,
  PLAY,
  GAMEOVER,
  PAUSE,
}

export const useGameState = defineStore("gameState", () => {
  // ---- Состояния ----
  const currentState = ref<GAME_STATES>(GAME_STATES.PRELOADER);
  const isDebug = ref(false);

  // ---- Actions ----
  function toggleDebug() {
    isDebug.value = !isDebug.value;
  }

  function setState(state: GAME_STATES) {
    console.log(
      "[gameState] setState:",
      GAME_STATES[state],
      state,
      "previous:",
      GAME_STATES[currentState.value],
    );
    currentState.value = state;
  }

  function startGame() {
    setState(GAME_STATES.PLAY);
    useProgressStore().score = 0;
    usePlayerStore().speed = 0;
  }

  function pauseGame() {
    if (currentState.value === GAME_STATES.PLAY) setState(GAME_STATES.PAUSE);
  }

  function resumeGame() {
    if (currentState.value === GAME_STATES.PAUSE) setState(GAME_STATES.PLAY);
  }

  function endGame() {
    setState(GAME_STATES.GAMEOVER);
    useProgressStore().saveHighScore();
  }

  function goToMenu() {
    setState(GAME_STATES.MENU);
  }

  return {
    currentState,
    isDebug,

    setState,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    goToMenu,
    toggleDebug,
  };
});
