<!-- src/components/MainMenu.vue -->
<template>
  <div class="menu-overlay">
    <h4 class="menu-title__mini">{{ $t("gameTitle") }}</h4>

    <template v-if="isSettingsEnabled">
      <SettingsOverlay />
      <button class="menu-btn" @click="goBackToMenu">
        {{ $t("mainMenu.goBack") }}
      </button>

    </template>

    <template v-else>

      <!-- <h1 class="menu-subtitle">{{ $t("mainMenu.title") }}</h1> -->

      <div class="menu-btns">
        <button class="menu-btn" @click="startGame">{{ $t("mainMenu.startGame") }}</button>
        <button class="menu-btn" @click="goToSettings">{{ $t("mainMenu.settings") }}</button>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useGameState } from "@/store/gameState";
import SettingsOverlay from "./settings/SettingsOverlay.vue";
import { GameStates } from "@/game/core/GameState";

const gameStore = useGameState();

const isSettingsEnabled = ref(false);


function goToSettings() {
  isSettingsEnabled.value = true;
}

function goBackToMenu() {
  isSettingsEnabled.value = false;
}

function startGame() {
  gameStore.setState(GameStates.Countdown);
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