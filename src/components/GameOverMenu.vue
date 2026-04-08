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
    const distance = computed(() => progressStore.getDistanceInCubes());
    const currentSpeedRounded = computed(() => playerStore.getCurrentSpeedInCubesPerHour(1));

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

    onMounted(() => {
        isHeaderShown.value = true;
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";

    .container_correction {
        justify-content: flex-start !important;
        top: 13.313rem;
    }

    .header_correction {
        font-size: 3.125rem; // (50px)
        color: #F79CFF;
    }

    .rotate_180 {
        rotate: 180deg;
    }

    .image_correction {
        filter: invert(90%) sepia(13%) saturate(4482%) hue-rotate(235deg) brightness(103%) contrast(101%);
    }

    .btn_correction {
        font-size: 1.875rem; // (30px)
    }

    .group_correction {
        margin-top: 25rem;
        
        &>*+* {
            margin-top: 1.56rem; // 25px - row-gap (между кнопками)
        }
    }

    .score_container {
        width: 25rem;
        margin: 2.5rem;
        gap: 1rem;
        display: flex;
        flex-direction: column;


        font-family: 'jost-light';
        text-transform: uppercase;
        font-size: 1.375rem;
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