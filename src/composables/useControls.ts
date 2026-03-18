// src/composables/useControls.ts
import { onMounted, onUnmounted } from "vue";
import { useGameState } from "@/store/gameState";
import type { useGame } from "./useGame";
import { usePlayerStore } from "@/store/playerStore";
import { CarManager } from "@/game/car";
import { GameStates } from "@/game/core/GameState";

export function useControls(game: ReturnType<typeof useGame>) {
  const gameStore = useGameState();

  function processEscape() {
    switch (gameStore.currentState) {
      case GameStates.Play:
        gameStore.pauseGame();
        break;
      case GameStates.Pause:
        gameStore.resumeGame();
        break;
      case GameStates.Menu:
        break;
      case GameStates.Gameover:
        gameStore.goToMenu();
        break;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== "Escape") e.preventDefault();

    switch (e.key) {
      case "ArrowLeft":
        game.movePlayerLeft(60 / 1000);
        break;
      case "ArrowRight":
        game.movePlayerRight(60 / 1000);
        break;
      case " ":
        game.shoot();
        break;
      case "n":
        usePlayerStore().enableNitro();
        CarManager.getInstance().enableNitro();
        break;
      case "Escape":
        processEscape();
        break;
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === "n") {
      e.preventDefault();
      usePlayerStore().disableNitro();
      CarManager.getInstance().disableNitro();
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  });
}
