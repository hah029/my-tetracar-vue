// src/composables/useControls.ts
import { onMounted, onUnmounted } from "vue";
import { GAME_STATES, useGameState } from "@/store/gameState";
import type { useGame } from "./useGame";

export function useControls(game: ReturnType<typeof useGame>) {
  const gameStore = useGameState();

  function processEscape() {
    switch (gameStore.currentState) {
      case GAME_STATES.PLAY:
        gameStore.pauseGame();
        break;
      case GAME_STATES.PAUSE:
        gameStore.resumeGame();
        break;
      case GAME_STATES.MENU:
        break;
      case GAME_STATES.GAMEOVER:
        gameStore.goToMenu();
        break;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== "Escape") e.preventDefault();

    switch (e.key) {
      case "ArrowLeft":
        game.movePlayerLeft();
        break;
      case "ArrowRight":
        game.movePlayerRight();
        break;
      // case " ":
      //   gameStore.enableNitro();
      //   break;
      case "Escape":
        processEscape();
        break;
    }
  }

  // function handleKeyUp(e: KeyboardEvent) {
  //   if (e.key === " ") {
  //     e.preventDefault();
  //     gameStore.disableNitro();
  //   }
  // }

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    // window.addEventListener("keyup", handleKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    // window.removeEventListener("keyup", handleKeyUp);
  });
}
