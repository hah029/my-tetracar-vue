<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick, Transition } from "vue";
import { useThree } from "./composables/useThree";
import { useGame } from "./composables/useGame";
import { useGameState } from "./store/gameState";
import { useControls } from "./composables/useControls";
import MainMenu from "./components/MainMenu.vue";
import Preloader from "./components/Preloader.vue";
import PauseMenu from "./components/PauseMenu.vue";
import HUD from "./components/HUD.vue";
import GameOverMenu from "./components/GameOverMenu.vue";
import { GameLoop } from "./composables/useAnimate";
import { CameraSystem } from "@/game/camera/CameraSystem";
import { SoundManager } from "./game/sound/SoundManager";

const threeRoot = ref<HTMLDivElement | null>(null);
const { getScene, getCamera, getComposer, getMotionBlurPass } = useThree(threeRoot);
const game = useGame();
const gameState = useGameState();

useControls(game);
gameState.setState("preloader");

const getUIComponent = computed(() => {
  switch (gameState.currentState) {
    case 'preloader':
      return Preloader;
    case 'menu':
      return MainMenu;
    case 'paused':
      return PauseMenu;
    case 'gameover':
      return GameOverMenu;
    case 'playing':
      return HUD;
  }
});
let loop: ReturnType<typeof GameLoop>;
let soundManager: SoundManager;

onMounted(() => {
  const scene = getScene();
  const camera = getCamera();
  const composer = getComposer();
  const motionBlur = getMotionBlurPass();

  game.init(scene);
  CameraSystem.initialize(camera);
  soundManager = SoundManager.getInstance();
  soundManager.initialize(camera);
  const volume = Number(localStorage.getItem("masterVolume") ?? 0.6);
  soundManager.setMasterVolume(volume);

  loop = GameLoop(game, composer, motionBlur);
  loop.start();
});

onUnmounted(() => {
  loop?.stop();
});

watch(
  () => gameState.currentState,
  async (newState, oldState) => {
    if ((oldState === "gameover" || oldState === "menu") && newState === "playing") {
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
  (state) => {

    if (state === "menu") {
      soundManager.fadeOut("music_background", 0.1);
      setTimeout(() => {
        soundManager.playMusicSequence("music_intro", "music_background");
      }, 100);
    }

    if (state === "playing") {
      // soundManager.fadeOut("music_background", 0.1);
      soundManager.stopAllMusic();
      setTimeout(() => {
        soundManager.play("music_background");
      }, 100);
    }

    if (state === "gameover") {
      soundManager.fadeOut("music_background", 0.1);
      setTimeout(() => {
        soundManager.play("music_gameover");
      }, 100);
    }

    if (state === "preloader") {
      soundManager.stopAllMusic();
    }

  }
)

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
</style>