<!-- src/components/MainMenu.vue -->
<template>
  <div class="menu-overlay">
    <h1 class="menu-title">TETROCAR</h1>
    <button class="menu-btn" @click="letsPlay">НАЖМИ НА КНОПКУ</button>
  </div>
</template>

<script setup lang="ts">
import { GAME_STATES as GS, useGameState } from "@/store/gameState";

// Подключаем store
const gameStore = useGameState();

function letsPlay() {
  gameStore.setState(GS.MENU);
}
</script>

<style scoped>
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