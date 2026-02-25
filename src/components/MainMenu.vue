<!-- src/components/MainMenu.vue -->
<template>
  <div
    v-if="isVisible"
    class="main-menu-overlay"
  >
    <div class="menu-container">
      <h1 class="menu-title">TETRACAR</h1>
      <button class="menu-btn start-btn" @click="startGame">Начать игру</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGameState } from "../store/gameState";

// Подключаем store
const gameStore = useGameState();

// Видимость меню зависит от состояния игры
const isVisible = computed(() => gameStore.currentState === "menu");

function startGame() {
  gameStore.setState("playing");
  gameStore.resetGameData();
}
</script>

<style scoped>
.main-menu-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2000;
}

.menu-container {
  text-align: center;
  color: white;
  font-family: 'Arial', sans-serif;
}

.menu-title {
  font-size: 72px;
  margin-bottom: 50px;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.menu-btn {
  background: none;
  color: white;
  border: none;
  padding: 20px 60px;
  margin: 10px;
  font-size: 24px;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.menu-btn:hover {
  transform: scale(1.1);
}
</style>