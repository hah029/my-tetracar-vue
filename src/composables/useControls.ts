// src/composables/useControls.ts

import { onMounted, onUnmounted, ref } from "vue";
import { useGameState } from "@/store/gameState";
import { usePlayerStore } from "@/store/playerStore";
import { CarManager } from "@/game/car";
import { BaseItem } from "@/game/interactive/items/BaseItem";
import { GameStates } from "@/game/core/GameState";
import type { useGame } from "./useGame";

export function useControls(game: ReturnType<typeof useGame>) {
  const gameStore = useGameState();
  const playerStore = usePlayerStore();

  const touchZoneRef = ref<HTMLElement | null>(null);

  const processedKeys = new Set<string>();

  const INPUT_DT = 1000 / 60;
  const MOVE_REPEAT_INTERVAL = 90;

  const TAP_DISTANCE = 20;
  const TAP_DURATION = 250;
  const SWIPE_THRESHOLD = 40;

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let lastMoveRepeatTime = 0;

  enum controlKeys {
    LEFT = "ArrowLeft",
    LEFT_ALT = "KeyA",

    RIGHT = "ArrowRight",
    RIGHT_ALT = "KeyD",

    DOWN = "ArrowDown",
    DOWN_ALT = "KeyS",

    UP = "ArrowUp",
    UP_ALT = "KeyW",

    SPACE = "Space",

    NITRO = "KeyN",
    MAGNET = "KeyM",

    ESCAPE = "Escape",

    ENTER = "Enter",
    ENTER_NUMPAD = "NumpadEnter",
  }

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
        ) {
          gameStore.activeOverlay = null;
        }
        break;

      case GameStates.Gameover:
        playerStore.resetPlayerAchievements();
        gameStore.goToMenu();
        break;
    }
  }

  function processEnter() {
    switch (gameStore.currentState) {
      case GameStates.Preloader:
        gameStore.isPreloaderShown = false;
        gameStore.goToMenu();
        break;
    }
  }

  function handleGameGesture(action: "left" | "right" | "up" | "down" | "tap") {
    if (gameStore.currentState !== GameStates.Play) return;

    switch (action) {
      case "left":
        game.movePlayerLeft(INPUT_DT);
        break;

      case "right":
        game.movePlayerRight(INPUT_DT);
        break;

      case "up":
        game.jumpPlayer(INPUT_DT);
        break;

      case "down":
        playerStore.forceJump = true;

        setTimeout(() => {
          playerStore.forceJump = false;
        }, 50);

        break;

      case "tap":
        game.shoot();
        break;
    }
  }

  function registerTouchZone(element: HTMLElement | null) {
    cleanup();

    touchZoneRef.value = element;

    if (!element) return;

    element.style.touchAction = "none";

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];

      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      const duration = Date.now() - startTime;

      if (
        absX < TAP_DISTANCE &&
        absY < TAP_DISTANCE &&
        duration < TAP_DURATION
      ) {
        handleGameGesture("tap");
        return;
      }

      if (absX > absY) {
        if (deltaX > SWIPE_THRESHOLD) {
          handleGameGesture("right");
        } else if (deltaX < -SWIPE_THRESHOLD) {
          handleGameGesture("left");
        }
      } else {
        if (deltaY < -SWIPE_THRESHOLD) {
          handleGameGesture("up");
        } else if (deltaY > SWIPE_THRESHOLD) {
          handleGameGesture("down");
        }
      }
    };

    element.addEventListener("touchstart", onTouchStart, {
      passive: true,
    });

    element.addEventListener("touchend", onTouchEnd, {
      passive: true,
    });

    (element as any)._touchStartHandler = onTouchStart;
    (element as any)._touchEndHandler = onTouchEnd;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.code === "KeyQ") {
      return;
    }

    if (e.key !== controlKeys.ESCAPE) {
      e.preventDefault();
    }

    switch (e.code) {
      case controlKeys.LEFT:
      case controlKeys.LEFT_ALT:
        if (e.repeat && !canProcessMoveRepeat()) return;
        handleGameGesture("left");
        break;

      case controlKeys.RIGHT:
      case controlKeys.RIGHT_ALT:
        if (e.repeat && !canProcessMoveRepeat()) return;
        handleGameGesture("right");
        break;

      case controlKeys.UP:
      case controlKeys.UP_ALT:
        if (processedKeys.has(e.code)) return;
        processedKeys.add(e.code);
        handleGameGesture("up");
        break;

      case controlKeys.DOWN:
      case controlKeys.DOWN_ALT:
        if (processedKeys.has(e.code)) return;
        processedKeys.add(e.code);
        playerStore.forceJump = true;
        break;

      case controlKeys.SPACE:
        if (processedKeys.has(e.code)) return;
        processedKeys.add(e.code);
        handleGameGesture("tap");
        break;

      case controlKeys.NITRO:
        if (processedKeys.has(e.code)) return;
        processedKeys.add(e.code);
        playerStore.enableNitro();
        CarManager.getInstance().enableNitro();
        break;

      case controlKeys.MAGNET:
        if (processedKeys.has(e.code)) return;
        processedKeys.add(e.code);
        playerStore.enableMagnet([BaseItem]);
        break;

      case controlKeys.ESCAPE:
        if (processedKeys.has(e.code)) return;
        processedKeys.add(e.code);
        processEscape();
        break;

      case controlKeys.ENTER:
      case controlKeys.ENTER_NUMPAD:
        if (processedKeys.has(e.code)) return;
        processedKeys.add(e.code);
        processEnter();
        break;
    }
  }

  function canProcessMoveRepeat(): boolean {
    const now = performance.now();
    if (now - lastMoveRepeatTime < MOVE_REPEAT_INTERVAL) return false;

    lastMoveRepeatTime = now;
    return true;
  }

  function handleKeyUp(e: KeyboardEvent) {
    processedKeys.delete(e.code);

    switch (e.code) {
      case controlKeys.NITRO:
        playerStore.disableNitro();
        CarManager.getInstance().disableNitro();
        break;

      case controlKeys.DOWN:
      case controlKeys.DOWN_ALT:
        playerStore.forceJump = false;
        break;
    }
  }

  function cleanup() {
    if (touchZoneRef.value && (touchZoneRef.value as any)._touchStartHandler) {
      touchZoneRef.value.removeEventListener(
        "touchstart",
        (touchZoneRef.value as any)._touchStartHandler,
      );
    }

    if (touchZoneRef.value && (touchZoneRef.value as any)._touchEndHandler) {
      touchZoneRef.value.removeEventListener(
        "touchend",
        (touchZoneRef.value as any)._touchEndHandler,
      );
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);

    processedKeys.clear();

    cleanup();
  });

  return {
    registerTouchZone,
    cleanup,
  };
}
