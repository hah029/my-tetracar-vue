<template>
  <div v-if="isVisible" class="pause-overlay">
    <div class="menu-container">

      <h4 class="menu-title__mini">TETROCAR</h4>

      <template v-if="isSettingsEnabled">

        <h1 class="menu-subtitle">НАСТРОЙКИ</h1>

        <div class="settings">

          <div class="settings-row">
            <span>Music</span>
            <button class="toggle-btn" @click="toggleMusic">
              {{ audioStore.musicEnabled ? "ON" : "OFF" }}
            </button>
          </div>

          <div class="settings-row">
            <span>SFX</span>
            <button class="toggle-btn" @click="toggleSound">
              {{ audioStore.sfxEnabled ? "ON" : "OFF" }}
            </button>
          </div>

          <div class="settings-row volume-row">
            <span>Volume</span>
            <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="updateVolume" />
            <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
          </div>

        </div>

        <button class="menu-btn" @click="goBackToPauseMenu">
          НАЗАД
        </button>

      </template>

      <template v-else>

        <h1 class="menu-subtitle">ПАУЗА</h1>

        <div class="menu-btns">
          <button class="menu-btn resume-btn" @click="resumeGame">Продолжить</button>
          <button class="menu-btn settings-btn" @click="goToSettings">Настройки</button>
          <button class="menu-btn main-menu-btn" @click="goToMainMenu">Выйти в меню</button>
        </div>

      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { GAME_STATES as GS, useGameState } from "@/store/gameState";
import { useAudioStore } from "@/store/audioStore";
import { SoundManager } from "@/game/sound/SoundManager";

const gameStore = useGameState();
const audioStore = useAudioStore();
const soundManager = SoundManager.getInstance();

const isSettingsEnabled = ref(false);
const volume = ref(Number(localStorage.getItem("masterVolume") ?? 0.6));

const isVisible = computed(() => gameStore.currentState === GS.PAUSE);

function resumeGame() {
  gameStore.setState(GS.PLAY);
}

function goToMainMenu() {
  gameStore.setState(GS.MENU);
}

function goToSettings() {
  isSettingsEnabled.value = true;
}

function goBackToPauseMenu() {
  isSettingsEnabled.value = false;
}

function toggleMusic() {
  audioStore.toggleMusic();
  if (audioStore.musicEnabled) soundManager.play("music_background");
}

function toggleSound() {
  audioStore.toggleSFX();
}

function updateVolume() {
  soundManager.setMasterVolume(volume.value);
  localStorage.setItem("masterVolume", volume.value.toString());
  soundManager.play("sfx_click");
}
</script>

<style scoped lang="scss">
.pause-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.804);
  z-index: 1000;
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
  margin: 0 0 30px 0;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
}

.menu-btns {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.menu-btn {
  background: none;
  color: white;
  border: none;
  padding: 10px;
  margin: 10px 0;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.1s ease;

  &:hover {
    opacity: 0.75;
    text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
  }
}

/* SETTINGS */
.settings {
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin: 30px 0;
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