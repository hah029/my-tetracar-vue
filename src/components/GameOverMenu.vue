<!-- src/components/GameOverMenu.vue -->
<template>
  <div v-if="isVisible" class="gameover-overlay">
    <div class="menu-container">
      <h1 class="gameover-title">GAME OVER</h1>

      <div class="score-container">
        <div class="score-label">YOUR SCORE</div>
        <div class="score-value">{{ scoreRounded }}</div>

        <div class="score-label">BEST SCORE</div>
        <div class="best-value" :class="{ newRecord: isNewRecord }">
          <span v-if="isNewRecord">🏆 {{ highScoreRounded }} 🏆</span>
          <span v-else>{{ highScoreRounded }}</span>
        </div>
      </div>

      <div class="buttons-container">
        <button class="menu-btn restart-btn" @click="restartGame">🔄 ИГРАТЬ СНОВА</button>
        <button class="menu-btn main-menu-btn" @click="goToMainMenu">🏠 ГЛАВНОЕ МЕНЮ</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGameState } from "../store/gameState";
// import { useScore } from "../composables/useScore";

const gameState = useGameState();
// const { score, highScore, resetScore } = useScore();

// Меню отображается только при состоянии gameover
const isVisible = computed(() => gameState.currentState === "gameover");

// Проверяем, есть ли новый рекорд
const isNewRecord = computed(() => gameState.score >= gameState.highScore);

// Округлённые значения для отображения
const scoreRounded = computed(() => Math.floor(gameState.score));
const highScoreRounded = computed(() => Math.floor(gameState.highScore));

function restartGame() {
  gameState.resetScore();
  gameState.resetGameData();
  gameState.setState("playing");
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
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 2000;
}

.menu-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 50px;
  border-radius: 30px;
  text-align: center;
  color: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90%;
  transform: scale(1);
  transition: transform 0.5s ease;
}

.gameover-title {
  font-size: 64px;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #ff4444, #ff8844);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(255, 68, 68, 0.3);
  animation: pulse 2s infinite;
  letter-spacing: 4px;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.score-container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  margin: 30px 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.score-label {
  font-size: 16px;
  opacity: 0.7;
  margin-bottom: 5px;
}

.score-value {
  font-size: 48px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255,215,0,0.5);
  margin-bottom: 20px;
}

.best-value {
  font-size: 24px;
  color: #00ffff;
  text-shadow: 0 0 15px rgba(0,255,255,0.5);
}

.best-value.newRecord {
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255,215,0,0.8);
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
}

.menu-btn {
  padding: 18px 30px;
  font-size: 20px;
  font-weight: bold;
  border-radius: 15px;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2);
  transition: all 0.3s ease;
  letter-spacing: 2px;
}

.restart-btn {
  background: linear-gradient(90deg, #4CAF50, #45a049);
  color: white;
}

.main-menu-btn {
  background: linear-gradient(90deg, #2196F3, #1976D2);
  color: white;
}

.menu-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.4);
}
</style>