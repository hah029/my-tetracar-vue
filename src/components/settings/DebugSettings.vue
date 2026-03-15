<template>
  <div class="settings">

    <div class="settings-row">
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
.settings {
  display: flex;
  flex-direction: column;
  gap: 25px;
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