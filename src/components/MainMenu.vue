<template>
    <SettingsOverlay v-if="gameStore.activeOverlay === 'settings'" />
    <TransitionGroup v-else name="buttons_group_showing" tag="div" class="buttons_group">
        <button v-for="(btn, index) in menuButtons" :key="btn.id" class="menu_btn"
            :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
            {{ btn.text }}
        </button>
    </TransitionGroup>
</template>


<script setup lang="ts">
import { computed } from "vue";
import { useGameState } from "@/store/gameState";
import SettingsOverlay from "./settings/SettingsOverlay.vue";
import { GameStates } from "@/game/core/GameState";
import { createNewText } from '@/helpers/functions';

const foo = createNewText();

// подключаем store
const gameStore = useGameState();

const menuButtons = computed(() => [
    { id: 1, text: foo.makeText("mainMenu.startGame"), action: startGame },
    { id: 2, text: foo.makeText("mainMenu.shop"), action: null },
    { id: 3, text: foo.makeText("mainMenu.settings"), action: goToSettings },
    { id: 4, text: foo.makeText("mainMenu.leaderboards"), action: null },
]);

function startGame() {
    gameStore.setState(GameStates.Countdown);
};

function goToSettings() {
    gameStore.openSettings();
}
</script>


<style lang="scss" scoped>
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";
</style>