// src/composables/useControls.ts
import { onMounted, onUnmounted } from "vue";
import { useGameState } from "@/store/gameState";
import type { useGame } from "./useGame";
import { usePlayerStore } from "@/store/playerStore";
import { CarManager } from "@/game/car";
import { GameStates } from "@/game/core/GameState";

export function useControls(game: ReturnType<typeof useGame>) {
    const gameStore = useGameState();
    const playerStore = usePlayerStore();

    enum controlKeys {
        LEFT = 'ArrowLeft',
        LEFT_ALT = 'a',
        LEFT_ALT_RU = 'ф',

        RIGHT = 'ArrowRight',
        RIGHT_ALT = 'd',
        RIGHT_ALT_RU = 'в',

        SPACE = ' ',
        NITRO = 'n',
        SHOP = 'b',
        ESCAPE = 'Escape',
        ENTER = 'Enter',
        ENTER_NUMPAD = 'NumpadEnter',
    };

    // события на кнопку Escape
    function processEscape() {
        switch (gameStore.currentState) {
            case GameStates.Play:
                gameStore.pauseGame();
                break;

            case GameStates.Pause:
                if (gameStore.activeOverlay === 'settings' || gameStore.activeOverlay === 'quitConfirm') {
                    gameStore.activeOverlay = null;
                } else {
                    gameStore.resumeGame();
                };
                break;

            case GameStates.Menu:
                if (gameStore.activeOverlay === 'settings' || gameStore.activeOverlay === 'leaderBoards') gameStore.activeOverlay = null;
                break;

            case GameStates.Gameover:
                console.log('useControls 50');
                
                playerStore.resetPlayerAchievements();
                gameStore.goToMenu();
                break;
        };
    };

    // события на кнопку Enter
    function processEnter() {
        switch (gameStore.currentState) {
            case GameStates.Preloader:
                gameStore.isPreloaderShown = false;
                gameStore.goToMenu();
                break;
        };
    };

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key !== controlKeys.ESCAPE) e.preventDefault();

        switch (e.key) {
            case controlKeys.LEFT:
            case controlKeys.LEFT_ALT:
            case controlKeys.LEFT_ALT_RU:
                game.movePlayerLeft(60 / 1000);
                break;

            case controlKeys.RIGHT:
            case controlKeys.RIGHT_ALT:
            case controlKeys.RIGHT_ALT_RU:
                game.movePlayerRight(60 / 1000);
                break;

            case controlKeys.SPACE:
                game.shoot();
                break;

            case controlKeys.NITRO:
                usePlayerStore().enableNitro();
                CarManager.getInstance().enableNitro();
                break;

            case controlKeys.ESCAPE:
                processEscape();
                break;

            case controlKeys.ENTER:
            case controlKeys.ENTER_NUMPAD:
                processEnter();
                break;
        };
    };

    

    function handleKeyUp(e: KeyboardEvent) {
        if (e.key === "n") {
            e.preventDefault();
            usePlayerStore().disableNitro();
            CarManager.getInstance().disableNitro();
        };
    };

    onMounted(() => {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
    });

    onUnmounted(() => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
    });
}
