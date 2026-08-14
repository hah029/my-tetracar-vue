// src/composables/useControls.ts

import { onMounted, onUnmounted } from "vue";
import { useGameState } from "@/store/gameState";
import { usePlayerStore } from "@/store/playerStore";
import { CarManager } from "@/game/car";
import { CameraSystem } from "@/game/camera/CameraSystem";
import { BaseItem } from "@/game/interactive/items/BaseItem";
import { GameStates } from "@/game/core/GameState";
import type { useGame } from "./useGame";

export function useControls(game: ReturnType<typeof useGame>) {
  const gameStore = useGameState();
  const playerStore = usePlayerStore();

  const processedKeys = new Set<string>();

  const INPUT_DT = 1000 / 60;
  const MOVE_REPEAT_INTERVAL = 90;

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

  function handleTouchControl(action: "left" | "right" | "up" | "down" | "fire") {
    handleGameGesture(action === "fire" ? "tap" : action);
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
        CameraSystem.triggerNitroShake();
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

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);

    processedKeys.clear();

  });

  return {
    handleTouchControl,
  };
}
