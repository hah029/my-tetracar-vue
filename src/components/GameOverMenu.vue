<template>
    <div class="container">

        <Transition name="header_footer_block_anim" mode="out-in">
            <div class="header_block">
                <div class="header_text corr_header_size">{{ $t("gameOverMenu.title") }}</div>
                <div class="header_image">
                    <img class='image' src="@/assets/images/title_line_image.svg" />
                </div>
            </div>
        </Transition>

        <div class="score-container">
            <div class="settings-row">
                <span>{{ $t("gameOverMenu.summary.points.label") }}</span>
                <span>
                    <span class="score-value gold">{{ scoreRounded }} / </span>
                    <span class="score-value gold newRecord">
                        {{ highScoreRounded }}
                    </span>
                </span>
            </div>
            <div class="settings-row">
                <span>{{ $t("gameOverMenu.summary.speed.label") }}</span>
                <span>
                    <span class="score-value gold">
                        {{ currentSpeedRounded }}
                    </span>
                    <span class="score-value gold newRecord">
                        {{ $t("gameOverMenu.summary.speed.units") }}
                    </span>
                </span>
            </div>

            <div class="settings-row">
                <span>{{ $t("gameOverMenu.summary.distance.label") }}</span>
                <span>
                    <span class="score-value gold">
                        {{ distance }}
                    </span>
                    <span class="score-value gold newRecord">
                        {{ $t("gameOverMenu.summary.distance.units") }}
                    </span>
                </span>
            </div>
        </div>

        <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group">
            <button v-for="(btn, index) in menuButtons" v-if="gameStore.activeOverlay !== 'settings'" :key="btn.id"
                class="menu_btn" :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
                {{ btn.text }}
            </button>
        </TransitionGroup>

    </div>
</template>


<script setup lang="ts">
import { computed } from "vue";
import { useGameState } from "../store/gameState";
import { usePlayerStore } from "../store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { GameStates } from "@/game/core/GameState";
import { createNewText } from '@/helpers/functions';

// подключаем store
const gameState = useGameState();
const playerStore = usePlayerStore();
const progressStore = useProgressStore();

const scoreRounded = computed(() => Math.floor(progressStore.score));
const highScoreRounded = computed(() => Math.floor(progressStore.highScore));
const distance = computed(() => progressStore.getDistanceInCubes());
const currentSpeedRounded = computed(() => playerStore.getCurrentSpeedInCubesPerHour(1));


// const dynamicTitleName = computed(() => foo.makeText("gameOverMenu.title", 'empty'));

const gameStore = useGameState();
const foo = createNewText();
const menuButtons = computed(() => [
    { id: 1, text: foo.makeText("gameOverMenu.menuList.restartGame"), action: restartGame },
    { id: 2, text: foo.makeText("gameOverMenu.menuList.goToMainMenu"), action: goToMainMenu },
]);

function restartGame() {
    gameState.setState(GameStates.Countdown);
};

function goToMainMenu() {
    gameState.setState(GameStates.Menu);
};
</script>


<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";

.container {
    margin: 0 auto;
    // text-align: center;
    background: #000000bb;
    justify-content: center;
}

.buttons_group {
    // position: absolute;
    // bottom: 19.57%;
    height: fit-content;
    display: flex;
    flex-direction: column;
    background: none;
    border: none;

    // имитируем row-gap (между кнопками)
    &>*+* {
        margin-top: 1.56rem;
    }
}

.menu_btn {
    background: none;
    border: none;
    // ---
    font-family: 'vla_shu';
    font-size: 2.25rem; // (36px)
    color: #FDFFE3;
    filter: drop-shadow(0 0 15px rgba(255, 246, 25, 0.4));
    cursor: pointer;
    transition: all 0.1s ease-in-out;

    &:hover {
        color: #72B3EE;
        filter: drop-shadow(0 0 20px rgba(121, 190, 255, 1));
        transition: all 0.1s ease-in-out;
    }
}



.score-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 30%;
    margin-bottom: 30px;
    padding: 20px 0;
    // border-top: 1px solid white;
    // border-bottom: 1px solid white;
    font-family: 'vla_shu';
}

.settings-row {
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    font-weight: bold;
    color: #FDFFE3;
    // text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.score-value {
    font-size: 20px;

    &.gold {
        color: #ffd700;
    }

    &.newRecord {
        color: #ffd900bc;
        font-size: 16px;
    }
}

.menu-btns {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.menu-btn {
    padding: 15px 40px;
    font-size: 20px;
    cursor: pointer;
    font-weight: bold;
    border: none;
    color: white;
    background: none;
    text-transform: uppercase;
    transition: all 0.2s ease;

    &:hover {
        opacity: 0.9;
        text-shadow: 0 0 20px rgba(255, 0, 0, 1)
    }
}
</style>