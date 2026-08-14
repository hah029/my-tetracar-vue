<template>
    <div :key="'game_over'" class="container container_correction">
        <Transition name="header_footer_block_anim">
            <div v-if="isHeaderShown" class="header_block">
                <div class="header_text header_correction">{{ dynamicTitleName }}</div>
                <div class="header_image">
                    <img class='image image_correction' src="@/assets/images/title_line_image.svg" />
                </div>
            </div>
        </Transition>

        <div class="score_container">
            <div class="settings_row">
                <span>{{ $t("gameOverMenu.summary.points.label") }}</span>
                <span>
                    <span class="score-value gold">{{ scoreRounded }} / </span>
                    <span class="score-value gold newRecord">
                        {{ highScoreRounded }}
                    </span>
                </span>
            </div>
            <div class="settings_row">
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
            <div class="settings_row">
                <span>{{ $t("gameOverMenu.summary.goldens.label") }}</span>
                <span>
                    <span class="score-value gold">
                        +{{ goldens }}
                    </span>
                </span>

            </div>
            <div class="settings_row">
                <span>{{ $t("gameOverMenu.summary.energons.label") }}</span>
                <span>
                    <span class="score-value gold">
                        +{{ energons }}
                    </span>
                </span>
            </div>
        </div>

        <div class="header_image rotate_180">
            <img class='image image_correction' src="@/assets/images/title_line_image.svg" />
        </div>

        <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group group_correction">
            <button v-for="(btn, index) in menuButtons" v-if="gameStore.activeOverlay !== 'settings'" :key="btn.id"
                class="menu_btn btn_correction" :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
                {{ btn.text }}
            </button>
        </TransitionGroup>
    </div>
</template>


<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useGameState } from "../store/gameState";
import { usePlayerStore } from "../store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { GameStates } from "@/game/core/GameState";
import { createNewText } from '@/helpers/functions';

// подключаем store
const gameState = useGameState();
const playerStore = usePlayerStore();
const progressStore = useProgressStore();
const gameStore = useGameState();

// генерируем фразу для титула
const foo = createNewText();
const isHeaderShown = ref(false);
const dynamicTitleName = computed(() => foo.makeText("gameOverMenu.title", 'empty'));

// генерируем результаты гонки
const scoreRounded = computed(() => Math.floor(progressStore.score));
const highScoreRounded = computed(() => Math.floor(progressStore.highScore));
const currentSpeedRounded = computed(() => (playerStore.getCurrentSpeed() * 100).toFixed(2));
const goldens = computed(() => progressStore.currentGoldens);
const energons = computed(() => progressStore.currentEnergons);

const menuButtons = computed(() => [
    { id: 1, text: foo.makeText("gameOverMenu.menuList.restartGame"), action: restartGame },
    { id: 2, text: foo.makeText("gameOverMenu.menuList.goToMainMenu"), action: goToMainMenu },
]);

function restartGame() {
    playerStore.resetPlayerAchievements();
    gameState.setState(GameStates.Countdown);
};

function goToMainMenu() {
    playerStore.resetPlayerAchievements();
    gameState.setState(GameStates.Menu);
};

onMounted(() => {
    isHeaderShown.value = true;
});
</script>


<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";
@use "@/styles/typography" as *;
@use "@/styles/colors" as *;

.container_correction {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: clamp(0.75rem, 3vh, 2rem) 1rem;
    background-color: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(2px);
    gap: clamp(0.75rem, 3.4vh, 2.5rem);
    overflow-y: auto;
}

.header_correction {
    @include text-button-size-xl;
    color: #F79CFF;
}

.container_correction .header_block {
    margin-bottom: clamp(0.5rem, 2.2vh, 1.5rem);
}

.container_correction .header_text {
    margin-bottom: clamp(0.35rem, 1.4vh, 0.9rem);
}

.container_correction .header_image {
    width: min(102vh, 90vw);
}

.rotate_180 {
    rotate: 180deg;
}

.image_correction {
    filter: invert(90%) sepia(13%) saturate(4482%) hue-rotate(235deg) brightness(103%) contrast(101%);
}

.btn_correction {
    @include text-button-size-s;
    color: $color-yellow-super-light;
}

.group_correction {
    position: static !important;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: clamp(0.75rem, 2.5vh, 2rem);

    &>*+* {
        margin-top: 0;
    }
}

.score_container {
    width: min(25rem, 90vw);
    gap: clamp(0.4rem, 1.5vh, 1rem);
    display: flex;
    flex-direction: column;
    // height: 100%;


    font-family: 'jost-light';
    text-transform: uppercase;
    font-size: clamp(1rem, 2vmin, 1.375rem);
    color: #F79CFF;
}

.settings_row {
    display: flex;
    justify-content: space-between;
    // font-size: 16px;
    // font-weight: bold;
    // color: #FDFFE3;
}

.score-value {
    font-size: clamp(1rem, 1.8vmin, 1.25rem);

    &.gold {
        color: #ffd700;
    }

    &.newRecord {
        color: #ffd900bc;
        font-size: clamp(0.9rem, 1.55vmin, 1rem);
    }
}

// На горизонтальных мобильных экранах размеры остальных меню привязаны к
// высоте viewport; для Game Over используем ту же модель, чтобы все блоки
// помещались без наложений.
@media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) {
    .container_correction {
        padding-block: 2.5vh;
        gap: 2.8vh;
    }

    .score_container {
        width: min(50vh, 72vw);
    }
}

@media (min-width: $breakpoint-laptop) and (orientation: landscape) {
    .container_correction {
        padding-block: 2.2vw;
        gap: 1.25vw;
    }

    .score_container {
        width: min(22vw, 25rem);
    }
}

@media (min-width: $breakpoint-desktop) and (orientation: landscape) {
    .container_correction {
        padding-block: 2.6vw;
        gap: 1.45vw;
    }

    .score_container {
        width: min(20.8vw, 25rem);
    }
}

@media (max-height: 540px) and (orientation: landscape) {
    .container_correction {
        padding-block: 2vh;
        gap: 1.2vh;
    }

    .container_correction .header_block {
        margin-bottom: 0.8vh;
    }

    .container_correction .header_text {
        margin-bottom: 0.6vh;
    }

    .score_container {
        gap: 0.6vh;
    }

    .group_correction {
        gap: 1.4vh;
    }
}
</style>
