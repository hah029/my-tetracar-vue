<template>
    <div v-if="isVisible" class="menu_overlay">

        <h4 class="menu-title__mini">TETROCAR</h4>
        <h1 class="menu-subtitle">GAME OVER</h1>

        <div class="score-container">
        <div class="settings-row">
            <span>ОЧКИ</span>
            <span>
            <span class="score-value gold">{{ scoreRounded }} / </span>
            <span class="score-value gold newRecord">
                {{ highScoreRounded }}
            </span>
            </span>
        </div>
        <div class="settings-row">
            <span>СКОРОСТЬ</span>
            <span>
            <span class="score-value gold">
                {{ currentSpeedRounded }}
            </span>
            <span class="score-value gold newRecord">
                куб/ч
            </span>
            </span>
        </div>

        <div class="settings-row">
            <span>ДИСТАНЦИЯ</span>
            <span>
            <span class="score-value gold">
                {{ distance }}
            </span>
            <span class="score-value gold newRecord">
                кубов
            </span>
            </span>
        </div>
        </div>

        <div class="menu-btns">
            <button class="menu-btn restart-btn" @click="restartGame">ИГРАТЬ СНОВА</button>
            <button class="menu-btn main-menu-btn" @click="goToMainMenu">ГЛАВНОЕ МЕНЮ</button>
        </div>
    </div>
</template>


<script setup lang="ts">
    import { computed, defineEmits } from "vue";
    import { useGameState } from "../store/gameState";
    import { usePlayerStore } from "../store/playerStore";
    import { useProgressStore } from "@/store/progressStore";
    import { GameStates } from "@/game/core/GameState";

    // подключаем store
    const gameState = useGameState();
    const playerStore = usePlayerStore();
    const progressStore = useProgressStore();

    // подключаем emit
    const emit = defineEmits(['event']);

    const isVisible = computed(() => gameState.currentState === GameStates.Gameover);

    const scoreRounded = computed(() => Math.floor(progressStore.score));
    const highScoreRounded = computed(() => Math.floor(progressStore.highScore));
    const distance = computed(() => progressStore.getDistanceInCubes());
    const currentSpeedRounded = computed(() => playerStore.getCurrentSpeedInCubesPerHour(1));

    function restartGame() {
        gameState.setState(GameStates.Countdown);
    };

    function goToMainMenu() {
        gameState.setState(GameStates.Menu);
        emit('event', 'returnToMenu');
    };
</script>


<style scoped lang="scss">
    .menu-title__mini {
        font-size: 28px;
        margin: 0;
        margin-bottom: 10px;
        text-shadow: 0 0 20px rgba(85, 0, 0, 0.741);
        border-bottom: 1px solid white;
    }

    .menu-subtitle {
        font-size: 54px;
        margin: 0 0 30px 0;
        text-shadow: 0 0 20px rgba(161, 0, 0, 0.741);
    }

    .score-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 30%;
        margin-bottom: 30px;
        padding: 20px 0;
        border-top: 1px solid white;
        border-bottom: 1px solid white;
    }

    .settings-row {
        display: flex;
        justify-content: space-between;
        font-size: 16px;
        font-weight: bold;
        text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
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