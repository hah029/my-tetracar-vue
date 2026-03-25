<template>
    <!-- <div class="container"> -->

    <Transition name="header_footer_block_anim" mode="out-in">
        <div class="header_block">
            <div class="header_text corr_header_size">{{ $t("gameOverMenu.title") }}</div>
            <div class="header_image">
                <img class='image' src="@/assets/images/title_line_image.svg" />
            </div>
        </div>
    </Transition>

    <div class="score-container">
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

    <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group group_correction">
        <button v-for="(btn, index) in menuButtons" v-if="gameStore.activeOverlay !== 'settings'" :key="btn.id"
            class="menu_btn" :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
            {{ btn.text }}
        </button>
    </TransitionGroup>

    <!-- </div> -->
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

    .group_correction {
        // gap: 2rem;
        &>*+* {
            margin-top: 1.56rem; // 25px - row-gap (между кнопками)
        }
    }

    .score-container {
        display: flex;
        flex-direction: column;
        gap: 5rem;
        // width: 40%;
        margin: 50px;
        font-family: 'vla_shu';
    }

    .settings_row {
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
</style>