<template>
    <!-- <div class="container"> -->

    <!-- SETTINGS OVERLAY -->
    <Transition name="fade" mode="out-in">
        <SettingsOverlay v-if="gameStore.activeOverlay === 'settings'" :key="'settings'" />
    </Transition>

    <!-- PAUSE MENU -->
    <div v-if="gameStore.activeOverlay !== 'settings'" :key="'pause'" class="pause_container">

        <!-- HEADER с анимацией -->
        <Transition name="header_footer_block_anim" mode="out-in">
            <div class="header_block">
                <div class="header_text corr_header_size">{{ dynamicTitleName }}</div>
                <div class="header_image">
                    <img class='image' src="@/assets/images/title_line_image.svg" />
                </div>
            </div>
        </Transition>

        <!-- Кнопки с TransitionGroup -->
        <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group">
            <button v-for="(btn, index) in menuButtons" v-if="gameStore.activeOverlay !== 'settings'" :key="btn.id"
                class="menu_btn" :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
                {{ btn.text }}
            </button>
        </TransitionGroup>

    </div>
    <!-- </div> -->
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGameState } from "@/store/gameState";
import SettingsOverlay from "./settings/SettingsOverlay.vue";
import { GameStates } from "@/game/core/GameState";
import { createNewText } from '@/helpers/functions';

const gameStore = useGameState();
const foo = createNewText();

const menuButtons = computed(() => [
    { id: 1, text: foo.makeText("pauseMenu.menuList.resume"), action: resumeGame },
    { id: 2, text: foo.makeText("pauseMenu.menuList.settings"), action: goToSettings },
    { id: 3, text: foo.makeText("pauseMenu.menuList.menu"), action: goToMainMenu },
]);

const dynamicTitleName = computed(() => foo.makeText("pauseMenu.title", 'empty'));

function resumeGame() {
    gameStore.setState(GameStates.Play);
}

function goToMainMenu() {
    gameStore.setState(GameStates.Menu);
}

function goToSettings() {
    gameStore.openSettings();
}
</script>

<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";


// .corr_header_size {
//     font-size: 3.125rem !important;
// }

/* TransitionGroup для кнопок */
</style>