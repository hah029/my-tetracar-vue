<!-- src/components/GameOverMenu.vue -->
<template>
  <div class="gameover-overlay">
    <div class="menu-container">
      <h1 class="gameover-title">GAME OVER</h1>

      <div class="score-container">
        <div class="score-block">
          <div class="score-label">ОЧКИ</div>
          <div class="score-value">{{ scoreRounded }}</div>
        </div>
        <div class="score-block">
          <div class="score-label">ЛУЧШИЙ РЕЗУЛЬТАТ</div>
          <div class="best-value" :class="{ newRecord: isNewRecord }">
            <span v-if="isNewRecord">{{ highScoreRounded }}</span>
            <span v-else>{{ highScoreRounded }}</span>
          </div>
        </div>
      </div>

      <div class="buttons-container">
        <button class="menu-btn restart-btn" @click="restartGame">ИГРАТЬ СНОВА</button>
        <button class="menu-btn main-menu-btn" @click="goToMainMenu">ГЛАВНОЕ МЕНЮ</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGameState } from "../store/gameState";
import { useGame } from "../composables/useGame";

const gameState = useGameState();
const game = useGame();

// Проверяем, есть ли новый рекорд
const isNewRecord = computed(() => gameState.score >= gameState.highScore);

// Округлённые значения для отображения
const scoreRounded = computed(() => Math.floor(gameState.score));
const highScoreRounded = computed(() => Math.floor(gameState.highScore));

function restartGame() {
  console.log('🎮 Перезапуск игры из GameOverMenu...');
  
  // 1. Сбрасываем состояние игры (очки и т.д.)
  gameState.resetScore();
  gameState.resetGameData();
  
  // 2. Сбрасываем ВСЕ игровые объекты через useGame
  game.reset(); // ← ВЫЗЫВАЕМ СБРОС
  
  // 3. Переключаем состояние на playing
  gameState.setState("playing");
  
  console.log('✅ Игра перезапущена');
}

function goToMainMenu() {
  gameState.resetScore();
  gameState.setState("menu");
}
</script>

<style scoped>
.gameover-overlay {
    position: fixed;
    inset: 0;
    background: rgba(57, 23, 23, 0.768);
    backdrop-filter: blur(2px);
    z-index: 2000;
    color: white;
}

.menu-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: auto;
  text-align: center;
  max-width: 24rem;
  transform: scale(1);
  transition: transform 0.5s ease;
  height: 100%;
  gap: 4rem;
}

.gameover-title {
  font-size: 48px;
  margin-bottom: 20px;
}


.score-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.score-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
  border-bottom: 1px solid #ffffff3e;
}

.score-label {
  font-size: 16px;
}

.score-value, .best-value {
  padding: 0.5rem 0;
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255,215,0,0.5);
}


.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
}

.menu-btn {
  padding: 18px 30px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  outline: 1px solid rgba(255, 255, 255, 0);
  transition: all 0.3s ease;
  letter-spacing: 2px;
}

.restart-btn {
  background: none;
  color: white;
}

.main-menu-btn {
  background: none;
  color: white;
}

.menu-btn:hover {
  background-color: rgba(255, 255, 255, 0.181);
}
</style>