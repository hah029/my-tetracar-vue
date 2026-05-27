<template>
    <div class="container">
        <!-- SETTINGS -->
        <SettingsRoot v-if="gameStore.activeOverlay === 'settings'" />

        <!-- LEADERBOARDS -->
        <LeaderBoardsRoot v-if="gameStore.activeOverlay === 'leaderBoards'" />

        <!-- LEADERBOARDS -->
        <ShopRoot v-if="gameStore.activeOverlay === 'shop'" />

        <!-- MAIN MENU -->
        <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group group_correction">
            <button v-for="(btn, index) in menuButtons" v-if="isMainMenuEnabled" key="btn.id"
                class="menu_btn btn_correction" :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
                {{ btn.text }}
            </button>
        </TransitionGroup>
    </div>
</template>


<script setup lang="ts">
import { watch, ref, computed, onMounted } from "vue";
import { useGameState } from "@/store/gameState";
import { GameStates } from "@/game/core/GameState";
import { createNewText } from '@/helpers/functions';
import SettingsRoot from "./settings/SettingsRoot.vue";
import LeaderBoardsRoot from "./leaderboards/LeaderBoardsRoot.vue";
import ShopRoot from "./shop/ShopRoot.vue";

import { useProgressStore } from "@/store/progressStore";

const progressStore = useProgressStore();

const foo = createNewText();

// подключаем store
const gameStore = useGameState();

const isMainMenuEnabled = ref(false);

const menuButtons = computed(() => [
    { id: 1, text: foo.makeText("mainMenu.startGame"), action: startGame },
    { id: 2, text: foo.makeText("mainMenu.shop"), action: goToShop },
    { id: 3, text: foo.makeText("mainMenu.settings"), action: goToSettings },
    { id: 4, text: foo.makeText("mainMenu.leaderboards"), action: goToLeaderBoards },
]);

function startGame() {
    gameStore.setState(GameStates.Countdown);
};

function goToShop() {
    isMainMenuEnabled.value = false;
    setTimeout(() => {
        gameStore.openShop();
    }, 300);
};

function goToSettings() {
    isMainMenuEnabled.value = false;
    setTimeout(() => {
        gameStore.openSettings();
    }, 300);
};

function goToLeaderBoards() {
    isMainMenuEnabled.value = false;
    setTimeout(() => {
        gameStore.openLeaderBoards();
    }, 300);
};

watch(
    () => gameStore.activeOverlay,
    (newState) => {
        ['settings', 'leaderBoards', 'shop'].includes(newState as string) ? "" : isMainMenuEnabled.value = true;
    },
);

onMounted(() => {
    isMainMenuEnabled.value = true;

    progressStore.restoreProgress();
});
</script>


<style lang="scss" scoped>
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";

.group_correction {
    bottom: 19.57%;

    &>*+* {
        margin-top: 1.56rem; // 25px - row-gap (между кнопками)
    }
}

.btn_correction {
    font-size: 2.1875rem; // (35px)
}
</style>