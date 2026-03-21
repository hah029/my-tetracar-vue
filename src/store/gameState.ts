// src/store/gameState.ts
import { defineStore } from "pinia";
import { ref } from "vue";

// import { usePlayerStore } from "./playerStore";
import { useProgressStore } from "./progressStore";
import { GameStates } from "@/game/core/GameState";
import { SoundManager } from "@/game/sound/SoundManager";

type UIOverlay = null | "settings";

export const useGameState = defineStore("gameState", () => {
  // ===== STATE =====
  const currentState = ref<GameStates>(GameStates.Preloader);
  const isDebug = ref(false);
  const isFirstGame = ref(true);
  const activeOverlay = ref<UIOverlay>(null);

  let resetCallback: (() => void) | null = null;

  // ===== FSM: allowed transitions =====
  const transitions: Record<GameStates, GameStates[]> = {
    [GameStates.Preloader]: [GameStates.Menu],

    [GameStates.Menu]: [GameStates.Countdown],

    [GameStates.Countdown]: [GameStates.Play],

    [GameStates.Play]: [GameStates.Pause, GameStates.Gameover],

    [GameStates.Pause]: [GameStates.Play, GameStates.Menu],

    [GameStates.Gameover]: [GameStates.Menu, GameStates.Countdown],
  };

  // ===== HOOKS =====
  function onEnter(state: GameStates, prev: GameStates) {
    const progress = useProgressStore();
    // const player = usePlayerStore();
    const sound = SoundManager.getInstance();

    switch (state) {
      case GameStates.Preloader:
        sound.stopAllMusic();
        break;

      case GameStates.Menu:
        sound.playMusicSequence("music_intro", "music_background");

        if (prev === GameStates.Gameover || prev === GameStates.Pause) {
          resetCallback?.();
        }
        break;

      case GameStates.Countdown:
        if (prev === GameStates.Gameover || prev === GameStates.Pause) {
          resetCallback?.();
        }
        break;

      case GameStates.Play:
        sound.playMusic("music_background", true);
        break;

      case GameStates.Gameover:
        progress.saveHighScore();
        sound.playMusic("music_gameover");
        break;
    }
  }

  function onExit(state: GameStates, next: GameStates) {
    switch (state) {
      case GameStates.Play:
        console.log("⬅️ Exit Play");
        break;
    }
  }

  // ===== CORE FSM =====
  function canTransition(to: GameStates) {
    return transitions[currentState.value]?.includes(to);
  }

  function setState(to: GameStates) {
    const from = currentState.value;

    if (from === to) return;

    if (!canTransition(to)) {
      console.warn(`❌ Invalid transition: ${from} → ${to}`);
      return;
    }

    // exit hook
    onExit(from, to);

    // change state
    currentState.value = to;

    // enter hook
    onEnter(to, from);
  }

  // ===== PUBLIC API =====

  function startGame() {
    setState(GameStates.Countdown);
  }

  function startCountdown() {
    setState(GameStates.Countdown);
  }

  function pauseGame() {
    setState(GameStates.Pause);
  }

  function resumeGame() {
    setState(GameStates.Play);
  }

  function endGame() {
    setState(GameStates.Gameover);
  }

  function goToMenu() {
    setState(GameStates.Menu);
  }

  function toggleDebug() {
    isDebug.value = !isDebug.value;
  }

  function setResetCallback(cb: () => void) {
    resetCallback = cb;
  }

  function openSettings() {
    activeOverlay.value = "settings";
  }

  function closeOverlay() {
    activeOverlay.value = null;
  }

  return {
    currentState,
    isDebug,
    isFirstGame,
    activeOverlay,

    // FSM
    setState,

    // API
    startGame,
    startCountdown,
    pauseGame,
    resumeGame,
    endGame,
    goToMenu,
    setResetCallback,

    openSettings,
    closeOverlay,

    toggleDebug,
  };
});
