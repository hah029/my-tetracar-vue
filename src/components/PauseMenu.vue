<!-- src/components/PauseMenu.vue -->
<template>
  <div v-if="isVisible" class="pause-overlay">
    <div class="menu-container">
      <div class="buttons-container">
        <button class="menu-btn resume-btn" @click="resumeGame">Продолжить</button>
        <button class="menu-btn main-menu-btn" @click="goToMainMenu">Выйти в меню</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGameState } from "../store/gameState";

const gameStore = useGameState();

// Показываем меню только если игра в состоянии paused
const isVisible = computed(() => gameStore.currentState === "paused");

// Продолжить игру
function resumeGame() {
  gameStore.setState("playing");
}

// Переход в главное меню
function goToMainMenu() {
  gameStore.setState("menu");
}
</script>

<style scoped>
.pause-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.menu-container {
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  color: white;
  /* box-shadow: 0 10px 30px rgba(0,0,0,0.5); */
}

.pause-title {
  margin-bottom: 30px;
  font-size: 24px;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.menu-btn {
  padding: 15px 40px;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s;
  font-weight: bold;
  border: none;
  color: white;
  background: none;
  text-transform: uppercase;

}
/* 
.resume-btn {
  background-color: #4CAF50;
}

.main-menu-btn {
  background-color: #f44336;
} */

.menu-btn:hover { 
  outline: 1px solid white;
}
</style>