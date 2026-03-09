<!-- src/components/MainMenu.vue -->
<template>
  <div v-if="isVisible" class="main-menu-overlay">
    <div class="menu-container">

      <h4 class="menu-title__mini">TETROCAR</h4>

      <template v-if="isSettingsEnabled">

        <h1 class="menu-subtitle">НАСТРОЙКИ</h1>

        <div class="settings">

          <div class="settings-row">
            <span>МУЗЫКА</span>
            <button class="toggle-btn" @click="toggleMusic">
              {{ audioStore.musicEnabled ? "ВКЛ" : "ВЫКЛ" }}
            </button>
          </div>

          <div class="settings-row">
            <span>SFX</span>
            <button class="toggle-btn" @click="toggleSound">
              {{ audioStore.sfxEnabled ? "ВКЛ" : "ВЫКЛ" }}
            </button>
          </div>

          <div class="settings-row volume-row">
            <span>ГРОМКОСТЬ</span>

            <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="updateVolume" />

            <span class="volume-value">
              {{ Math.round(volume * 100) }}%
            </span>
          </div>

        </div>

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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useGameState } from "@/store/gameState";
import { useAudioStore } from "@/store/audioStore";
import { usePlayerStore } from "@/store/playerStore";
import { SoundManager } from "@/game/sound/SoundManager";

const gameStore = useGameState();
const audioStore = useAudioStore();
const playerStore = usePlayerStore();
const soundManager = SoundManager.getInstance();

const isSettingsEnabled = ref(false);

const volume = ref(
  Number(localStorage.getItem("masterVolume") ?? 0.6)
);

const isVisible = computed(() => gameStore.currentState === "menu");

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

  gameStore.setState("playing");
  playerStore.resetGameData();
}

function toggleMusic() {
  audioStore.toggleMusic();

  if (audioStore.musicEnabled) {
    soundManager.play("music_background");
  }
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