<!-- src/components/MainMenu.vue -->
<template>
  <div v-if="isVisible" class="main-menu-overlay">
    <div class="menu-container" v-if="isSettingsEnabled">
      <h4 class="menu-title__mini">TETROCAR</h4>
      <h1 class="menu-subtitle">НАСТРОЙКИ</h1>
      <div class="menu-btns">
        <!-- <button class="menu-btn start-btn" @click="startGame">СТАРТ</button> -->
        <div class="settings-btn-block">
          <button class="settings-btn" @click="toggleMusic">Music</button>
          <input class="settings-input" type="checkbox" disabled v-model="isMusicEnabled" />
        </div>
        <div class="settings-btn-block">
          <button class="settings-btn" @click="toggleSound">SFX</button>
          <input class="settings-input" type="checkbox" disabled v-model="isSFXEnabled" />
        </div>
      </div>
      <button class="menu-btn" @click="goBackToMenu">НАЗАД</button>
    </div>
    <div class="menu-container" v-else>
      <h4 class="menu-title__mini">TETROCAR</h4>
      <h1 class="menu-subtitle">ГЛАВНОЕ МЕНЮ</h1>
      <div class="menu-btns">
        <button class="menu-btn" @click="startGame">СТАРТ</button>
        <button class="menu-btn" @click="goToSettings">НАСТРОЙКИ</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useGameState } from "../store/gameState";
import { SoundManager } from "@/game/sound/SoundManager";

// Подключаем store
const gameStore = useGameState();
const isSettingsEnabled = ref(false);

// Видимость меню зависит от состояния игры
const isVisible = computed(() => gameStore.currentState === "menu");
const soundManager = SoundManager.getInstance();

function goToSettings() {
  if (isSettingsEnabled.value != true) isSettingsEnabled.value = true;
}
function goBackToMenu() {
  if (isSettingsEnabled.value != false) isSettingsEnabled.value = false;
}

function startGame() {
  soundManager.resume();

  // soundManager.play("sfx_intro");

  soundManager.play("sfx_3");
  soundManager.play("sfx_2");
  soundManager.play("sfx_2");
  soundManager.play("sfx_start");

  // setTimeout(() => soundManager.play("sfx_2"), 1000);
  // setTimeout(() => soundManager.play("sfx_1"), 2000);
  // setTimeout(() => soundManager.play("sfx_start"), 3000);

  gameStore.setState("playing");
  gameStore.resetGameData();
}

function toggleMusic() {
  soundManager.toggleMusic();
  if (soundManager.isMusicEnabled()) soundManager.play("music_background");
}
const isMusicEnabled = computed(() => soundManager.isMusicEnabled());

function toggleSound() {
  soundManager.toggleSFX();
}
const isSFXEnabled = computed(() => soundManager.isSFXEnabled());

</script>

<style scoped lang="scss">
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
</style>