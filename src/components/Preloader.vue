<!-- src/components/MainMenu.vue -->
<template>
    <div class="menu-overlay">
        <div class="gradient"></div>
        <div class="container">
            <div class="logo_group">
                <!-- <div class="logo_left">
                    <img class='logo_img' src="@/assets/images/logo_tetro_back.svg">
                </div>
                <div class="logo_right">
                    <img class='logo_img' src="@/assets/images/logo_car_back.svg">
                </div> -->
                <img class='logo_img' src="@/assets/images/logo_full_test_2.svg">
            </div>
            <button class="menu_btn" @click="letsPlay">- Нажми на кнопку -</button>
        </div>
    </div>
</template>


<script setup lang="ts">
    import { GAME_STATES as GS, useGameState } from "@/store/gameState";

    // Подключаем store
    const gameStore = useGameState();

    function letsPlay() {
        gameStore.setState(GS.MENU);
    }
</script>


<style lang="scss" scoped>
    .container {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        width: 100vw;
        height: 100vh;
    }

    .logo_group {
        width: 81.25%;
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: space-between;
        top: 18.47%;
    }
    .logo_left {
        width: 52.24%;
    }
    .logo_right {
        width: 48.08%;
    }
    .logo_img {
        width: 100%;
        shape-rendering: geometricPrecision;
    }

    .gradient {
        position: absolute;
        bottom: 0%;
        width: 100%;
        height: 50%;
        background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.8));
    }

    .menu_btn {
        position: absolute;
        bottom: 30.435%;
        height: fit-content;
        background: none;
        border: none;
        // ---
        font-family: 'vla_shu';
        font-size: 2.25rem; // (36px)
        color: #FDFFE3;
        filter: drop-shadow(0 0 15px rgba(255, 246, 25, 0.4));
        cursor: pointer;
        transition: all 0.2s ease-in-out;

        // Неоновое свечение с анимацией мерцания
        animation: enhancedBreathing 2s ease-in-out infinite;

        &:hover {
            transform: scale(1.02);
            color: #ffffff;
            filter: drop-shadow(0 0 20px rgba(255, 246, 25, 0.6));
            transition: all 0.2s ease-in-out;
            animation: enhancedBreathing 2s ease-in-out infinite;
        }
    }

    @keyframes enhancedBreathing {
        0%, 100% {
            filter: drop-shadow(0 0 15px rgba(255, 246, 25, 0.4));
        }
        30% {
            filter: drop-shadow(0 0 0.75rem rgba(255, 246, 25, 0.25))
                    drop-shadow(0 0 1.0625rem rgba(255, 246, 25, 0.1));
        }
        60% {
            filter: drop-shadow(0 0 1.375rem rgba(255, 246, 25, 0.55))
                    drop-shadow(0 0 1.5625rem rgba(255, 246, 25, 0.2));
        }
        80% {
            filter: drop-shadow(0 0 1.1875rem rgba(255, 246, 25, 0.42))
            drop-shadow(0 0 1.1875rem rgba(255, 246, 25, 0.12));
            color: #ffffff;
        }
    }

    /* @keyframes pulse {
        0% {
        transform: scale(1);
        opacity: 0.3;
        }

        50% {
        transform: scale(1.05);
        opacity: 0.5;
        }

        100% {
        transform: scale(1);
        opacity: 0.3;
        }
    } */
</style>