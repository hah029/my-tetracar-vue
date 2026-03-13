<template>
    <div class="menu-overlay">
        <div class="gradient"></div>

        <div class="container">
            <div class="logo_group">
                <div class="logo_left">
                    <img class='logo_img' src="@/assets/images/logo_tetro_back.svg">
                </div>
                <div class="logo_right">
                    <img class='logo_img' src="@/assets/images/logo_car_back.svg">
                </div>
            </div>
            <div class="logo_group">
                <div class="logo_left neon_glow neon_left">
                    <img class='logo_img neon_blue' src="@/assets/images/logo_tetro_lines.svg">
                </div>
                <div class="logo_right neon_glow neon_right">
                    <img class='logo_img neon_pink' src="@/assets/images/logo_car_lines.svg">
                </div>
            </div>

            <template v-if="!isSettingsEnabled">
                <div class="buttons_group">
                    <button class="menu_btn" @click="startGame">Старт</button>
                    <button class="menu_btn" @click="goToSettings">Гараж</button>
                    <button class="menu_btn" @click="goToSettings">Настройки</button>
                    <button class="menu_btn" @click="goToSettings">Рекорды</button>
                </div>
            </template>
            
            <template v-else>
                <SettingsOverlay />
                <button class="menu_btn" @click="goBackToMenu">
                    НАЗАД
                </button>
            </template>

        </div>

        <!-- <h4 class="menu-title__mini">TETROCAR</h4> -->

        <!-- <template v-if="isSettingsEnabled">
            <SettingsOverlay />
            <button class="menu_btn" @click="goBackToMenu">
                НАЗАД
            </button>
        </template>

        <template v-else>
            <h1 class="menu-subtitle">ГЛАВНОЕ МЕНЮ</h1>
            <div class="buttons_group">
                <button class="menu_btn" @click="startGame">СТАРТ</button>
                <button class="menu_btn" @click="goToSettings">НАСТРОЙКИ</button>
            </div>
        </template> -->

    </div>
</template>


<script setup lang="ts">
    import { ref } from "vue";
    import { GAME_STATES as GS, useGameState } from "@/store/gameState";
    import { usePlayerStore } from "@/store/playerStore";
    import { SoundManager } from "@/game/sound/SoundManager";
    import SettingsOverlay from "./settings/SettingsOverlay.vue";

    const gameStore = useGameState();
    const playerStore = usePlayerStore();
    const soundManager = SoundManager.getInstance();

    const isSettingsEnabled = ref(false);


    function goToSettings() {
        isSettingsEnabled.value = true;
    }

    function goBackToMenu() {
        isSettingsEnabled.value = false;
    }

    function startGame() {
        soundManager.resume();

        soundManager.play("sfx_3");
        soundManager.play("sfx_2");
        soundManager.play("sfx_start");
        playerStore.resetGameData();

        gameStore.setState(GS.PLAY);
    }
</script>


<style lang="scss" scoped>
    @use "@/styles/menu.scss";

    .logo_group {
        top: 13.04%;
    }

    .buttons_group {
        position: absolute;
        bottom: 19.57%;
        height: fit-content;
        display: flex;
        flex-direction: column;

        // имитируем row-gap (между кнопками)
        & > * + * {
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




    .menu-title__mini {
        font-size: 28px;
        margin: 0;
        margin-bottom: 10px;
        text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
        border-bottom: 1px solid white;
    }

    .menu-subtitle {
        font-size: 54px;
        margin: 0;
        text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
    }

    

    .settings-btn-block {
        &>.settings-btn {
            background: none;
            color: white;
            border: none;
            border-bottom: 1px solid #00000000;
            padding: 10px 20px;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s ease;
            cursor: pointer;

            &:hover {
            /* background-color: rgba(255, 255, 255, 0.181); */
            border-bottom: 1px solid #ffffff;
            /* transform: scale(1.05); */
            animation: none;
            opacity: 0.75;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
            }
        }
    }

    .settings {
        display: flex;
        flex-direction: column;
        gap: 25px;
        margin: 40px 0;
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
        width: 70px;

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