<!-- src/components/MainMenu.vue -->
<template>
  <div v-if="isVisible" class="main-menu-overlay">
    <div class="menu-container">
      <h1 class="menu-title">TETROCAR</h1>
      <button class="menu-btn start-btn" @click="letsPlay">НАЖМИ НА КНОПКУ</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { GAME_STATES as GS, useGameState } from "../store/gameState";

// Подключаем store
const gameStore = useGameState();

// Видимость меню зависит от состояния игры
const isVisible = computed(() => gameStore.currentState === GS.PRELOADER);

function letsPlay() {
  gameStore.setState(GS.MENU);
}
</script>

<style scoped>
.main-menu-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.804);
  z-index: 2000;
  backdrop-filter: blur(2px);
  font-family: Helvetica, Arial, sans-serif;
}

.menu-container {
  text-align: center;
  color: white;
}

.menu-title {
  font-size: 72px;
  margin-bottom: 50px;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }

  50% {
    transform: scale(1.05);
    opacity: 0.5;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
}

.menu-btn {
  background: none;
  color: white;
  border: none;
  padding: 20px 60px;
  margin: 10px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: pulse 2s infinite;

}

.menu-btn:hover {
  /* background-color: rgba(255, 255, 255, 0.181); */
  transform: scale(1.05);
  animation: none;
  opacity: 0.75;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
}
</style>