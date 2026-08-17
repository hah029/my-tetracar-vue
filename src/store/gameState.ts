// src/store/gameState.ts
import { defineStore } from "pinia";
import { ref, watch } from "vue";

import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "./progressStore";
import { useLevelStore } from "@/store/levelStore";
import { GameStates } from "@/game/core/GameState";
import { SoundManager } from "@/game/sound/SoundManager";
import { Platform } from "@/sdk";
import {
  RunTelemetry,
  Telemetry,
  type DefeatCause,
  type NavigationReason,
} from "@/telemetry";

type UIOverlay =
  | null
  | "settings"
  | "shop"
  | "dailyGift"
  | "fortuneWheel"
  | "objectives"
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

export type ObjectivesSection = "daily" | "achievements";

export const useGameState = defineStore("gameState", () => {
  // ===== STATE =====
  const currentState = ref<GameStates>(GameStates.Preloader);
  const isDebug = ref(false);
  const isPreloaderShown = ref(true);
  const isFirstGame = ref(false);
  const activeOverlay = ref<UIOverlay>(null);
  const previousState = ref<GameStates>(GameStates.Preloader); // Запоминаем предыдущее состояние
  
  const settingsSection = ref<SettingsSection>(null);
  const objectivesSection = ref<ObjectivesSection>("daily");

  const playerStore = usePlayerStore();
  const platform = Platform.getInstance();
  
  let resetCallback: (() => void) | null = null;
  let pendingDefeatCause: DefeatCause = "unknown";

  watch(activeOverlay, (nextOverlay, previousOverlay) => {
    if (previousOverlay) {
      Telemetry.emit({
        type: "ui.overlay_closed",
        overlay: previousOverlay,
      });
    }
    if (nextOverlay) {
      Telemetry.emit({
        type: "ui.overlay_opened",
        overlay: nextOverlay,
        section: nextOverlay === "settings" ? settingsSection.value ?? undefined : undefined,
      });
    }
  });

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
  function onEnter(
    state: GameStates,
    prev: GameStates,
    reason: NavigationReason = "system",
  ) {
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
        Telemetry.startRun({
          levelId: levelStore.currentLevel.id,
          difficultyId: levelStore.currentDifficultyId,
        });
        RunTelemetry.startRun();
        break;

      case GameStates.Play:
        sound.playMusic(levelStore.currentMusic.gameTrack, true);
        platform.gameStart();
        if (prev === GameStates.Pause) {
          Telemetry.resumeRun();
        } else {
          Telemetry.emit({
            type: "run.started",
            levelId: levelStore.currentLevel.id,
            difficultyId: levelStore.currentDifficultyId,
          });
        }
        break;

      case GameStates.Pause:
        if (prev === GameStates.Play) {
          Telemetry.suspendRun({
            reason: reason === "system" ? "page_hidden" : "manual_pause",
            batch: RunTelemetry.flush({
              score: progress.score,
              distance: progress.getDistanceInCubes(),
            }),
          });
          progress.saveProgress().catch((error) =>
            console.error("Failed to save progress on pause:", error),
          );
        }
        break;

      case GameStates.Gameover:
        if (Telemetry.getRunId()) {
          Telemetry.emit({
            type: "run.finished",
            reason: "crash",
            defeatCause: pendingDefeatCause,
            score: progress.score,
            distance: progress.getDistanceInCubes(),
            batch: RunTelemetry.flush({
              score: progress.score,
              distance: progress.getDistanceInCubes(),
            }),
            durationMs: Telemetry.getRunDurationMs(),
            isNewRecord: progress.isNewRecord,
          });
          Telemetry.finishRun();
          pendingDefeatCause = "unknown";
        }
        // Асинхронное сохранение прогресса перед переходом
        progress
          .saveProgress()
          .catch((err) =>
            console.error("Failed to save progress on gameover:", err),
        );
        sound.playMusic("music_gameover");
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

        if (next === GameStates.Menu && Telemetry.getRunId()) {
          Telemetry.emit({
            type: "run.finished",
            reason: "quit",
            score: progress.score,
            distance: progress.getDistanceInCubes(),
            batch: RunTelemetry.flush({
              score: progress.score,
              distance: progress.getDistanceInCubes(),
            }),
            durationMs: Telemetry.getRunDurationMs(),
            isNewRecord: progress.isNewRecord,
          });
          Telemetry.finishRun();
        }

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

  function setState(to: GameStates, reason: NavigationReason = "system") {
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
    onEnter(to, from, reason);

    Telemetry.emit({
      type: "navigation.state_changed",
      from,
      to,
      reason,
    });
  }

  function setFirstGameIndicator(value_: boolean) {
    isFirstGame.value = value_;
  }

  // ===== PUBLIC API =====

  function startGame() {
    Telemetry.emit({ type: "ui.action", name: "play_clicked", screen: "menu" });
    setState(GameStates.LevelSelect, "play_button");
  }

  function confirmLevelSelection() {
    setState(GameStates.Countdown, "level_confirmed");
  }

  function startCountdown() {
    setState(GameStates.Countdown);
  }

  function pauseGame() {
    setState(GameStates.Pause, "pause_button");
  }

  function pauseForPageHidden() {
    setState(GameStates.Pause, "system");
  }

  function resumeGame() {
    setState(GameStates.Play, "resume_button");
  }

  function endGame(defeatCause: DefeatCause = "unknown") {
    const sound = SoundManager.getInstance();
    sound.stopCueLoop("nitroActive");
    sound.stopCueLoop("magnetActive");
    playerStore.resetPlayerAchievements();
    pendingDefeatCause = defeatCause;
    setState(GameStates.Gameover, "crash");
  }

  function goToMenu() {
    setState(GameStates.Menu, "menu_button");
  }

  function toggleDebug() {
    isDebug.value = !isDebug.value;
  }

  function setResetCallback(cb: () => void) {
    resetCallback = cb;
  }

  function openShop() {
    Telemetry.emit({ type: "ui.action", name: "shop_opened", screen: currentState.value });
    activeOverlay.value = "shop";
  }

  function openDailyGift() {
    Telemetry.emit({ type: "ui.action", name: "daily_gift_opened", screen: currentState.value });
    activeOverlay.value = "dailyGift";
  }

  function openFortuneWheel() {
    Telemetry.emit({ type: "ui.action", name: "fortune_wheel_opened", screen: currentState.value });
    activeOverlay.value = "fortuneWheel";
  }

  function openObjectives(section: ObjectivesSection = "daily") {
    Telemetry.emit({ type: "ui.action", name: "objectives_opened", screen: currentState.value });
    objectivesSection.value = section;
    activeOverlay.value = "objectives";
  }

  function openSettings(section: SettingsSection = null) {
    Telemetry.emit({ type: "ui.action", name: "settings_opened", screen: currentState.value });
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
    Telemetry.emit({ type: "ui.action", name: "leaderboards_opened", screen: currentState.value });
    activeOverlay.value = "leaderBoards";
  }

  function openQuitGameWindow() {
    Telemetry.emit({ type: "ui.action", name: "quit_requested", screen: currentState.value });
    previousState.value = currentState.value; // Запоминаем текущее состояние
    activeOverlay.value = "quitConfirm";
  }

  // Функция для подтверждения выхода
  function confirmQuit() {
    // Логика выхода из игры
    console.log("👋 Игрок подтвердил выход");
    // Возвращаемся в меню
    setState(GameStates.Menu, "quit_confirmed");
    // Дополнительно: сброс игровых данных
    resetCallback?.();
  }

  // Функция для отмены выхода
  function cancelQuit() {
    Telemetry.emit({ type: "ui.action", name: "quit_cancelled", screen: currentState.value });
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
    objectivesSection,

    // FSM
    setState,
    setFirstGameIndicator,

    // API
    startGame,
    confirmLevelSelection,
    startCountdown,
    pauseGame,
    pauseForPageHidden,
    resumeGame,
    endGame,
    goToMenu,
    setResetCallback,

    openSettings,
    setSettingsSection,
    openShop,
    openDailyGift,
    openFortuneWheel,
    openObjectives,
    openLeaderBoards,
    openQuitGameWindow,
    confirmQuit,
    cancelQuit,
    closeOverlay,

    toggleDebug,
  };
});
