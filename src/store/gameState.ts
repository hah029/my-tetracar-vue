// src/store/gameState.ts
import { defineStore } from "pinia";
import { ref } from "vue";

import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "./progressStore";
import { useLevelStore } from "@/store/levelStore";
import { GameStates } from "@/game/core/GameState";
import { SoundManager } from "@/game/sound/SoundManager";
import { Platform } from "@/sdk";

type UIOverlay =
  | null
  | "settings"
  | "shop"
  | "dailyGift"
  | "quitConfirm"
  | "leaderBoards"
  | "trainingScreen";

export type SettingsSection =
  | null
  | "main"
  | "sound"
  | "graphics"
  | "language"
  | "controls"
  | "about";

export const useGameState = defineStore("gameState", () => {
  // ===== STATE =====
  const currentState = ref<GameStates>(GameStates.Preloader);
  const isDebug = ref(false);
  const isPreloaderShown = ref(true);
  const isFirstGame = ref(false);
  const activeOverlay = ref<UIOverlay>(null);
  const previousState = ref<GameStates>(GameStates.Preloader); // Запоминаем предыдущее состояние
  
  const settingsSection = ref<SettingsSection>(null);

  const playerStore = usePlayerStore();
  const platform = Platform.getInstance();
  
  let resetCallback: (() => void) | null = null;

  // ===== FSM: allowed transitions =====
  const transitions: Record<GameStates, GameStates[]> = {
    [GameStates.Preloader]: [GameStates.Menu],
    [GameStates.Menu]: [GameStates.LevelSelect],
    [GameStates.LevelSelect]: [GameStates.Menu, GameStates.Countdown],
    [GameStates.Countdown]: [GameStates.Play],
    [GameStates.Play]: [GameStates.Pause, GameStates.Gameover],
    [GameStates.Pause]: [GameStates.Play, GameStates.Menu],
    [GameStates.Gameover]: [GameStates.Menu, GameStates.Countdown],
    [GameStates.QuitConfirm]: [
      GameStates.Menu,
      GameStates.LevelSelect,
      GameStates.Play,
      GameStates.Pause,
      GameStates.Gameover,
    ],
  };

  // ===== HOOKS =====
  function onEnter(state: GameStates, prev: GameStates) {
    const progress = useProgressStore();
    const levelStore = useLevelStore();
    const sound = SoundManager.getInstance();

    switch (state) {
      case GameStates.Preloader:
        sound.stopAllMusic();
        break;

      case GameStates.Menu:
        if (levelStore.currentMusic.menuTrack) {
          sound.playMusicSequence(
            levelStore.currentMusic.menuTrack,
            levelStore.currentMusic.gameTrack,
          );
        } else {
          sound.playMusic(levelStore.currentMusic.gameTrack, true);
        }

        // Сохраняем прогресс только если данные уже были восстановлены
        // (при первом входе Preloader → Menu restoreProgress() ещё не вызывался,
        //  и saveProgress() перезапишет сохранённые данные нулями)
        if (prev !== GameStates.Preloader) {
          progress
            .saveProgress()
            .catch((err) =>
              console.error("Failed to save progress on menu:", err),
            );
        }

        if (prev === GameStates.Gameover || prev === GameStates.Pause) {
          resetCallback?.();
        }
        break;

      case GameStates.LevelSelect:
        break;

      case GameStates.Countdown:
        if (
          prev === GameStates.LevelSelect ||
          prev === GameStates.Gameover ||
          prev === GameStates.Pause
        ) {
          resetCallback?.();
        }

        playerStore.applyGameplayConfig(levelStore.currentGameplay);
        playerStore.resetPlayerAchievements();
        playerStore.resetGameData();
        break;

      case GameStates.Play:
        sound.playMusic(levelStore.currentMusic.gameTrack, true);
        platform.gameStart();
        break;

      case GameStates.Gameover:
        // Асинхронное сохранение прогресса перед переходом
        progress
          .saveProgress()
          .catch((err) =>
            console.error("Failed to save progress on gameover:", err),
          );
        sound.playMusic("music_gameover");
        platform.gameStop();
        break;

      case GameStates.QuitConfirm:
        // При входе в состояние подтверждения выхода
        console.log("🚪 Открыто окно подтверждения выхода");
        activeOverlay.value = "quitConfirm";
        // Приостанавливаем музыку или оставляем фоном?
        // sound.pauseMusic(); // если есть такой метод
        break;
    }
  }

  function onExit(state: GameStates, next: GameStates) {
    switch (state) {
      case GameStates.Play: {
        console.log("⬅️ Exit Play");
        // Сохраняем прогресс при выходе из игры (в т.ч. при переходе в меню)
        const progress = useProgressStore();
        progress
          .saveProgress()
          .catch((err) =>
            console.error("Failed to save progress on exit play:", err),
          );

        platform.gameStop();
        break;
      }

      case GameStates.QuitConfirm:
        // При выходе из состояния подтверждения
        console.log("🚪 Закрыто окно подтверждения выхода");
        activeOverlay.value = null;
        // const sound = SoundManager.getInstance();
        // sound.resumeMusic(); // возобновляем музыку
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

  function setFirstGameIndicator(value_: boolean) {
    isFirstGame.value = value_;
  }

  // ===== PUBLIC API =====

  function startGame() {
    setState(GameStates.LevelSelect);
  }

  function confirmLevelSelection() {
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
    const sound = SoundManager.getInstance();
    sound.stopCueLoop("nitroActive");
    sound.stopCueLoop("magnetActive");
    playerStore.resetPlayerAchievements();
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

  function openShop() {
    activeOverlay.value = "shop";
  }

  function openDailyGift() {
    activeOverlay.value = "dailyGift";
  }

  function openSettings(section: SettingsSection = null) {
    activeOverlay.value = "settings";
    settingsSection.value = section || "main"; // если секция не указана — открываем главное меню
  }

  // Метод для переключения секции внутри настроек
  function setSettingsSection(section: SettingsSection) {
    // Если настройки уже открыты — просто меняем секцию
    if (activeOverlay.value === "settings") {
      settingsSection.value = section;
    } else {
      // Если настройки закрыты — открываем с нужной секцией
      openSettings(section);
    }
  }

  function openLeaderBoards() {
    activeOverlay.value = "leaderBoards";
  }

  function openQuitGameWindow() {
    previousState.value = currentState.value; // Запоминаем текущее состояние
    activeOverlay.value = "quitConfirm";
  }

  // Функция для подтверждения выхода
  function confirmQuit() {
    // Логика выхода из игры
    console.log("👋 Игрок подтвердил выход");
    // Возвращаемся в меню
    setState(GameStates.Menu);
    // Дополнительно: сброс игровых данных
    resetCallback?.();
  }

  // Функция для отмены выхода
  function cancelQuit() {
    // Возвращаемся в предыдущее состояние
    setState(previousState.value);
  }

  function closeOverlay() {
    activeOverlay.value = null;
    settingsSection.value = null; // 🔥 Сбрасываем секцию
  }

  return {
    currentState,
    isDebug,
    isPreloaderShown,
    isFirstGame,
    activeOverlay,
    settingsSection,

    // FSM
    setState,
    setFirstGameIndicator,

    // API
    startGame,
    confirmLevelSelection,
    startCountdown,
    pauseGame,
    resumeGame,
    endGame,
    goToMenu,
    setResetCallback,

    openSettings,
    setSettingsSection,
    openShop,
    openDailyGift,
    openLeaderBoards,
    openQuitGameWindow,
    confirmQuit,
    cancelQuit,
    closeOverlay,

    toggleDebug,
  };
});
