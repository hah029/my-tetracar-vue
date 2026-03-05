<template>
  <div v-if="isVisible" class="gameover-overlay">
    <div class="menu-container">

      <h4 class="menu-title__mini">TETROCAR</h4>
      <h1 class="menu-subtitle">GAME OVER</h1>

      <div class="settings score-container">
        <div class="settings-row">
          <span>ОЧКИ</span>
          <span class="score-value gold">{{ scoreRounded }}</span>
        </div>

        <div class="settings-row">
          <span>ЛУЧШИЙ РЕЗУЛЬТАТ</span>
          <span class="score-value gold" :class="{ newRecord: isNewRecord }">
            {{ highScoreRounded }}
          </span>
        </div>
      </div>

      <div class="menu-btns">
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

const isVisible = computed(() => gameState.currentState === "gameover");

const scoreRounded = computed(() => Math.floor(gameState.score));
const highScoreRounded = computed(() => Math.floor(gameState.highScore));
const isNewRecord = computed(() => gameState.score >= gameState.highScore);

function restartGame() {
  gameState.resetScore();
  gameState.resetGameData();
  game.reset();
  gameState.setState("playing");
}

function goToMainMenu() {
  gameState.resetScore();
  gameState.setState("menu");
}
</script>

<style scoped lang="scss">
.gameover-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.804);
  backdrop-filter: blur(2px);
  z-index: 2000;
  font-family: Helvetica, Arial, sans-serif;
}

.menu-container {
  text-align: center;
  color: white;
}

.menu-title__mini {
  font-size: 28px;
  margin: 0;
  margin-bottom: 10px;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
  border-bottom: 1px solid white;
}

.menu-subtitle {
  font-size: 54px;
  margin: 0 0 30px 0;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
}

.score-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.settings-row {
  display: flex;
  justify-content: space-between;
  font-size: 20px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.score-value.gold {
  color: #ffd700;
}

.menu-btns {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.menu-btn {
  padding: 15px 40px;
  font-size: 20px;
  cursor: pointer;
  font-weight: bold;
  border: none;
  color: white;
  background: none;
  text-transform: uppercase;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.75;
    text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
  }
}
</style>