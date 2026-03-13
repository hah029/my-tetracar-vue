<!-- src/components/MainMenu.vue -->
<template>
  <div class="menu-overlay">
    <h4 class="menu-title__mini">TETROCAR</h4>

    <template v-if="isSettingsEnabled">
      <SettingsOverlay />
      <button class="menu-btn" @click="goBackToMenu">
        НАЗАД
      </button>

    </template>

    <template v-else>

      <h1 class="menu-subtitle">ГЛАВНОЕ МЕНЮ</h1>

      <div class="menu-btns">
        <button class="menu-btn" @click="startGame">СТАРТ</button>
        <button class="menu-btn" @click="goToSettings">НАСТРОЙКИ</button>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useGameState } from "@/store/gameState";
import { usePlayerStore } from "@/store/playerStore";
import { SoundManager } from "@/game/sound/SoundManager";
import SettingsOverlay from "./settings/SettingsOverlay.vue";
import { GameStates } from "@/game/core/GameState";

const gameStore = useGameState();
const playerStore = usePlayerStore();
const soundManager = SoundManager.getInstance();

const isSettingsEnabled = ref(false);


function goToSettings() {
  isSettingsEnabled.value = true;
}

function goBackToMenu() {
  isSettingsEnabled.value = false;
}

function startGame() {
  soundManager.resume();

  soundManager.play("sfx_3");
  soundManager.play("sfx_2");
  soundManager.play("sfx_start");
  playerStore.resetGameData();

  gameStore.setState(GameStates.Play);
}
</script>

<style scoped lang="scss">
.menu-title__mini {
  font-size: 28px;
  margin: 0;
  margin-bottom: 10px;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
  border-bottom: 1px solid white;
}

.menu-subtitle {
  font-size: 54px;
  margin: 0;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
}

.menu-btns {
  padding: 40px;
  display: flex;
  flex-direction: column;
  // gap: 0px;
}

.menu-btn {
  background: none;
  text-transform: uppercase;
  color: white;
  border: none;
  padding: 10px;
  margin: 10px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.1s ease;

  &:hover {
    opacity: 0.75;
    text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
  }
}


.settings-btn-block {
  &>.settings-btn {
    background: none;
    color: white;
    border: none;
    border-bottom: 1px solid #00000000;
    padding: 10px 20px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      /* background-color: rgba(255, 255, 255, 0.181); */
      border-bottom: 1px solid #ffffff;
      /* transform: scale(1.05); */
      animation: none;
      opacity: 0.75;
      text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
    }
  }
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin: 40px 0;
}

.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.toggle-btn {
  background: none;
  border: 1px solid white;
  color: white;
  padding: 6px 14px;
  cursor: pointer;
  transition: 0.1s;
  width: 70px;

  &:hover {
    background: white;
    color: black;
  }
}

.volume-row input {
  flex: 1;
}

.volume-value {
  width: 50px;
  text-align: right;
}
</style>