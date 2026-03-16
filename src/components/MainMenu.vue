<template>
    <div class="container">
        <TransitionGroup 
            name="buttons_group_showing"
            tag="div"
            class="buttons_group" 
        >
            <button 
                v-for="(btn, index) in menuButtons" 
                v-if="isMainMenuEnabled" 
                :key="btn.id" 
                :data-index="index"
                class="menu_btn" 
                @click="btn.action"
            >
                {{ btn.text }}
            </button>
        </TransitionGroup>
        
        <div v-if="isSettingsEnabled">
            <SettingsOverlay />
            <button class="menu_btn" @click="goBackToMenu">Назад</button>
        </div>
    </div>
</template>


<script setup lang="ts">
    import { ref, onMounted } from "vue";
    import { GAME_STATES as GS, useGameState } from "@/store/gameState";
    import { usePlayerStore } from "@/store/playerStore";
    import { SoundManager } from "@/game/sound/SoundManager";
    import SettingsOverlay from "./settings/SettingsOverlay.vue";

    const gameStore = useGameState();
    const playerStore = usePlayerStore();
    const soundManager = SoundManager.getInstance();

    const isMainMenuEnabled = ref(false);
    const isSettingsEnabled = ref(false);

    const menuButtons = [
        { id: 1, text: 'Старт', action: startGame },
        { id: 2, text: 'Гараж', action: goToSettings },
        { id: 3, text: 'Настройки', action: goToSettings },
        { id: 4, text: 'Рекорды', action: goToSettings },
    ];

    function startGame() {
        soundManager.resume();

        soundManager.play("sfx_3");
        soundManager.play("sfx_2");
        soundManager.play("sfx_start");
        playerStore.resetGameData();

        gameStore.setState(GS.PLAY);
    };

    function goToSettings() {
        isMainMenuEnabled.value = false;
        isSettingsEnabled.value = true;
    };

    function goBackToMenu() {
        isSettingsEnabled.value = false;
        isMainMenuEnabled.value = true;
    };

    onMounted(() => {
        isMainMenuEnabled.value = true;
    });
</script>


<style lang="scss" scoped>
    @use "@/styles/menu.scss";

    // .test {
    //     z-index: 2000;
    // }

    .logo_group {
        top: 13.04%;
    }

    .buttons_group {
        position: absolute;
        bottom: 19.57%;
        height: fit-content;
        display: flex;
        flex-direction: column;
        background: none;
        border: none;

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




    .buttons_group_showing-enter-active {
        transition: all ease-in-out 0.7s;
    }
    .buttons_group_showing-enter-from {
        opacity: 0;
        transform: translateY(-25px);
    }


    // Индивидуальные задержки через data-атрибуты или n-го ребенка
    .buttons_group .menu_btn:nth-child(1) {
        transition-delay: 0s;
    }

    .buttons_group .menu_btn:nth-child(2) {
        transition-delay: 0.1s;
    }

    .buttons_group .menu_btn:nth-child(3) {
        transition-delay: 0.2s;
    }

    .buttons_group .menu_btn:nth-child(4) {
        transition-delay: 0.3s;
    }

    // Для исчезновения (обратный порядок)
    .buttons_group_showing-leave-active .menu_btn:nth-child(1) {
        transition-delay: 0.6s;
    }

    .buttons_group_showing-leave-active .menu_btn:nth-child(2) {
        transition-delay: 0.4s;
    }

    .buttons_group_showing-leave-active .menu_btn:nth-child(3) {
        transition-delay: 0.2s;
    }

    .buttons_group_showing-leave-active .menu_btn:nth-child(4) {
        transition-delay: 0s;
    }

    .buttons_group_showing-leave-active {
        transition: all 0.5s ease;
    }

    .buttons_group_showing-leave-to {
        opacity: 0;
        transform: translateY(-20px);
    }
</style>