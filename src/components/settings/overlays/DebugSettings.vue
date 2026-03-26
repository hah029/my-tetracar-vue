<template>
  <div class="settings">

    <div class="settings_row">
      <span>{{ $t("settings.debug.debugEnabled") }}</span>
      <button class="toggle-btn" @click="toggleDebug">
        {{ gameState.isDebug ? $t("settings.toggleOn") : $t("settings.toggleOff") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameState } from "@/store/gameState";

const gameState = useGameState();

function toggleDebug() {
  gameState.toggleDebug();
}

</script>

<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/settings.scss";
</style>