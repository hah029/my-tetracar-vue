// src/composables/useControls.ts
import { onMounted, onUnmounted, ref } from "vue";
import { useGameState } from "@/store/gameState";
import type { useGame } from "./useGame";
import { usePlayerStore } from "@/store/playerStore";
import { CarManager } from "@/game/car";
import { GameStates } from "@/game/core/GameState";

import Hammer from "hammerjs";
import { BaseItem } from "@/game/interactive/items/BaseItem";

export function useControls(game: ReturnType<typeof useGame>) {
  const gameStore = useGameState();
  const playerStore = usePlayerStore();

  // Refs для DOM элементов (будут установлены из HUD.vue)
  const swipeZoneRef = ref<HTMLElement | null>(null);
  let hammerManager: HammerManager | null = null;

  // Множество для отслеживания обработанных клавиш (защита от автоповтора)
  const processedKeys = new Set<string>();

  enum controlKeys {
    LEFT = "ArrowLeft",
    LEFT_ALT = "KeyA",
    RIGHT = "ArrowRight",
    RIGHT_ALT = "KeyD",
    DOWN = "ArrowDown",
    DOWN_ALT = "KeyS",

    SPACE = "Space",
    NITRO = "KeyN",
    MAGNET = "KeyM",
    SHOP = "KeyB",
    ESCAPE = "Escape",
    ENTER = "Enter",
    ENTER_NUMPAD = "NumpadEnter",
  }

  // Функция для регистрации зоны свайпов (вызывается из HUD.vue)
  function registerSwipeZone(element: HTMLElement | null) {
    // Очищаем предыдущий менеджер если есть
    if (hammerManager) {
      hammerManager.destroy();
      hammerManager = null;
    }

    swipeZoneRef.value = element;

    if (!element) return;

    // Создаем менеджер жестов
    hammerManager = new Hammer.Manager(element);

    // Настраиваем распознаватель свайпов (только горизонтальные)
    const swipeRecognizer = new Hammer.Swipe({
      direction: Hammer.DIRECTION_HORIZONTAL,
      threshold: 15, // Минимальное расстояние в пикселях
      velocity: 0.3, // Минимальная скорость
    });

    hammerManager.add(swipeRecognizer);

    // Обработка свайпа влево
    hammerManager.on("swipeleft", (e) => {
      e.preventDefault();
      if (gameStore.currentState === GameStates.Play) {
        game.movePlayerLeft(60 / 1000);
      }
    });

    // Обработка свайпа вправо
    hammerManager.on("swiperight", (e) => {
      e.preventDefault();
      if (gameStore.currentState === GameStates.Play) {
        game.movePlayerRight(60 / 1000);
      }
    });

    // Предотвращаем скролл страницы в зоне свайпов
    const preventScroll = (e: TouchEvent) => {
      if (gameStore.currentState === GameStates.Play) {
        e.preventDefault();
      }
    };

    element.addEventListener("touchmove", preventScroll, { passive: false });

    // Сохраняем обработчик для очистки
    (element as any)._preventScrollHandler = preventScroll;
  }

  // события на кнопку Escape
  function processEscape() {
    switch (gameStore.currentState) {
      case GameStates.Play:
        gameStore.pauseGame();
        break;

      case GameStates.Pause:
        if (
          gameStore.activeOverlay === "settings" ||
          gameStore.activeOverlay === "quitConfirm"
        ) {
          gameStore.activeOverlay = null;
        } else {
          gameStore.resumeGame();
        }
        break;

      case GameStates.Menu:
        if (
          gameStore.activeOverlay === "settings" ||
          gameStore.activeOverlay === "leaderBoards"
        )
          gameStore.activeOverlay = null;
        break;

      case GameStates.Gameover:
        playerStore.resetPlayerAchievements();
        gameStore.goToMenu();
        break;
    }
  }

  // события на кнопку Enter
  function processEnter() {
    switch (gameStore.currentState) {
      case GameStates.Preloader:
        gameStore.isPreloaderShown = false;
        gameStore.goToMenu();
        break;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== controlKeys.ESCAPE) e.preventDefault();

    switch (e.code) {
      case controlKeys.LEFT:
      case controlKeys.LEFT_ALT:
        game.movePlayerLeft(60 / 1000);
        break;

      case controlKeys.RIGHT:
      case controlKeys.RIGHT_ALT:
        game.movePlayerRight(60 / 1000);
        break;

      case controlKeys.DOWN:
      case controlKeys.DOWN_ALT:
        playerStore.forceJump = true;
        break;

      case controlKeys.SPACE:
        game.shoot();
        break;

      case controlKeys.NITRO:
        usePlayerStore().enableNitro();
        CarManager.getInstance().enableNitro();
        break;

      case controlKeys.MAGNET:
        usePlayerStore().enableMagnet([BaseItem]);
        break;

      case controlKeys.ESCAPE:
        processEscape();
        break;

      case controlKeys.ENTER:
      case controlKeys.ENTER_NUMPAD:
        processEnter();
        break;
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    // Убираем клавишу из множества обработанных при отпускании
    processedKeys.delete(e.code);

    if (e.code === controlKeys.NITRO) {
      e.preventDefault();
      playerStore.disableNitro();
    }
    if (e.code === controlKeys.DOWN || e.code === controlKeys.DOWN_ALT) {
      e.preventDefault();
      playerStore.forceJump = false;
    }
  }

  // Очистка ресурсов
  function cleanup() {
    if (hammerManager) {
      hammerManager.destroy();
      hammerManager = null;
    }

    if (
      swipeZoneRef.value &&
      (swipeZoneRef.value as any)._preventScrollHandler
    ) {
      swipeZoneRef.value.removeEventListener(
        "touchmove",
        (swipeZoneRef.value as any)._preventScrollHandler,
      );
      delete (swipeZoneRef.value as any)._preventScrollHandler;
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    processedKeys.clear(); // Очищаем множество при размонтировании
    cleanup();
  });

  // Возвращаем функцию регистрации для использования в компоненте
  return {
    registerSwipeZone,
    cleanup,
  };
}
