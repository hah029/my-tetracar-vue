<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick, Transition } from "vue";
// composable
import { useThree } from "./composables/useThree";
import { useGame } from "./composables/useGame";
import { useGameState } from "./store/gameState";
import { useControls } from "./composables/useControls";
import { GameLoop } from "./composables/useAnimate";
// components
import MainMenu from "./components/MainMenu.vue";
import Preloader from "./components/Preloader.vue";
import PauseMenu from "./components/PauseMenu.vue";
import HUD from "./components/hud/HUD.vue";
import GameOverMenu from "./components/GameOverMenu.vue";
import Countdown from "./components/Countdown.vue";
// managers
import { CameraSystem } from "@/game/camera/CameraSystem";
import { SoundManager } from "./game/sound/SoundManager";
import { DebugColliderVisualizer } from "./helpers/debug/DebugColliderVisualizer";
import { GameStates } from "./game/core/GameState";

const threeRoot = ref<HTMLDivElement | null>(null);
const { getScene, getCamera, getComposer } = useThree(threeRoot);
const game = useGame();
const gameState = useGameState();

useControls(game);

const getUIComponent = computed(() => {
  switch (gameState.currentState) {
    case GameStates.Preloader:
      return Preloader;
    case GameStates.Menu:
      return MainMenu;
    case GameStates.Pause:
      return PauseMenu;
    case GameStates.Gameover:
      return GameOverMenu;
    case GameStates.Play:
      return HUD;
    case GameStates.Countdown:   // ←
      return Countdown;
  }
});
let loop: ReturnType<typeof GameLoop>;
let soundManager: SoundManager;

onMounted(() => {
  const scene = getScene();
  const camera = getCamera();
  const composer = getComposer();
  // const motionBlur = getMotionBlurPass();

  // game init
  game.init(scene);

  // camera system init
  CameraSystem.initialize(camera);

  // audio settings
  soundManager = SoundManager.getInstance();
  soundManager.initialize(camera);

  // main loop initialize
  const debugCollider = new DebugColliderVisualizer(scene);
  loop = GameLoop(game, composer, debugCollider);
  loop.start();
});

onUnmounted(() => {
  loop?.stop();
});

watch(
  () => gameState.currentState,
  async (newState, oldState) => {
    if ((oldState === GameStates.Gameover || oldState === GameStates.Pause) && (newState === GameStates.Countdown || newState === GameStates.Menu)) {
      console.log("🔄 Game restart detected, resetting game...");

      // 1️⃣ Ждём обновления DOM/реактивных данных
      await nextTick();

      // 2️⃣ Сбрасываем игру
      game.reset();

      const carMesh = game.car.value.mesh;
      if (carMesh) {
        CameraSystem.reset(carMesh.position.clone());
      }

      console.log("✅ Game reset complete");
    }
  }
);

watch(
  () => gameState.currentState,
  (newState) => {
    console.log(`State changed to ${newState}`);
    switch (newState) {
      case GameStates.Preloader:
        soundManager.stopAllMusic();
        break;
      case GameStates.Menu:
        soundManager.playMusicSequence("music_intro", "music_background");
        break;
      case GameStates.Play:
        soundManager.playMusic("music_background", true);
        break;
      case GameStates.Gameover:
        soundManager.playMusic("music_gameover");
        break;
      // Countdown и Pause игнорируем – музыкой управляет сам компонент Countdown,
      // а в паузе музыка продолжает играть (можно добавить fadeOut, если нужно)
    }
  }
);

</script>

<template>
  <!-- canvas -->
  <div ref="threeRoot" class="three-root"></div>
  <!-- UI -->
  <transition>
    <component :is="getUIComponent" />
  </transition>
  <!-- <GameOverMenu /> -->
</template>

<style>
html,
body,
#app {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: Helvetica, Arial, sans-serif;
}

.three-root {
  width: 100%;
  height: 100%;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  backdrop-filter: blur(2px);
  text-align: center;
  color: white;
}
</style>