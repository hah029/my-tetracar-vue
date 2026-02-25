<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useThree } from "./composables/useThree";
import { useGame } from "./composables/useGame";
import { useGameState } from "./store/gameState";
import { useControls } from "./composables/useControls";
import MainMenu from "./components/MainMenu.vue";
import PauseMenu from "./components/PauseMenu.vue";
import HUD from "./components/HUD.vue";
import GameOverMenu from "./components/GameOverMenu.vue";
import { GameLoop } from "./composables/useAnimate";

const threeRoot = ref<HTMLDivElement | null>(null);
const { getScene, getCamera, getRenderer } = useThree(threeRoot);
const game = useGame();
const gameState = useGameState();

useControls();
gameState.setState("menu");

onMounted(() => {
  const scene = getScene();
  const camera = getCamera();
  const renderer = getRenderer();

  // Инициализация игры
  game.init(scene);
  const loop = GameLoop(game, scene, camera, renderer);
  loop.animate();
});
</script>

<template>
  <div ref="threeRoot" class="three-root"></div>
  <MainMenu v-if="gameState.currentState == 'menu'" />
  <PauseMenu v-if="gameState.currentState == 'paused'" />
  <GameOverMenu v-if="gameState.currentState == 'gameover'" />
  <HUD v-if="gameState.currentState == 'playing'" />
</template>

<style>
html, body, #app {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.three-root {
  width: 100%;
  height: 100%;
}
</style>