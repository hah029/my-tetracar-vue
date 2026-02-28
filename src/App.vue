<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useThree } from "./composables/useThree";
import { useGame } from "./composables/useGame";
import { useGameState } from "./store/gameState";
import { useControls } from "./composables/useControls";
import MainMenu from "./components/MainMenu.vue";
import PauseMenu from "./components/PauseMenu.vue";
import HUD from "./components/HUD.vue";
import GameOverMenu from "./components/GameOverMenu.vue";
import { GameLoop } from "./composables/useAnimate";
import { CameraSystem } from "@/game/camera/CameraSystem";

const threeRoot = ref<HTMLDivElement | null>(null);
const { getScene, getCamera, getRenderer } = useThree(threeRoot);
const game = useGame();
const gameState = useGameState();

useControls();
gameState.setState("menu");

const getUIComponent = computed(() => {
  switch (gameState.currentState) {
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


onMounted(() => {
  const scene = getScene();
  const camera = getCamera();
  const renderer = getRenderer();

  // Инициализация игры
  game.init(scene);
  CameraSystem.initialize(camera);

  const loop = GameLoop(game, scene, camera, renderer);
  loop.animate();
});
</script>

<template>
  <!-- canvas -->
  <div ref="threeRoot" class="three-root"></div>
  <!-- UI -->
  <component :is="getUIComponent" />
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