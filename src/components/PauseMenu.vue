<template>
    <div v-if="isVisible" class="menu_overlay">
        <!-- <h4 class="menu-title__mini">{{ $t("gameTitle") }}</h4> -->

        <!-- <div class="container correction">
            <div class="settings_container">

            </div>
        </div> -->

        <!-- <Transition name="header_footer_block_anim">
            <div v-if="isHeaderShown" class="header_block">
                <div class="header_text">{{ dynamicTitleName }}</div>
                <div class="header_image">
                    <img class='image' src="@/assets/images/title_line_image.svg">
                </div>
            </div>
        </Transition> -->

        <SettingsOverlay v-if="isSettingsEnabled" @event="handleEvent" />

        <template v-else>
            <h1 class="menu-subtitle">ПАУЗА</h1>
            <div class="menu-btns">
                <button class="menu-btn resume-btn" @click="resumeGame">Продолжить</button>
                <button class="menu-btn settings-btn" @click="goToSettings">Настройки</button>
                <button class="menu-btn main-menu-btn" @click="goToMainMenu">Выйти в меню</button>
            </div>
        </template>

    </div>
</template>


<script setup lang="ts">
    import { ref, defineEmits, computed } from "vue";
    import { useGameState } from "@/store/gameState";
    import SettingsOverlay from "./settings/SettingsOverlay.vue";
    import { GameStates } from "@/game/core/GameState";

    // подключаем store
    const gameStore = useGameState();

    // подключаем emit
    const emit = defineEmits(['event']);

    const isSettingsEnabled = ref(false);

    const isVisible = computed(() => gameStore.currentState === GameStates.Pause);

    function resumeGame() {
        gameStore.setState(GameStates.Play);
    };

    function goToMainMenu() {
        gameStore.setState(GameStates.Menu);
        emit('event', 'returnToMenu');
    };

    function goToSettings() {
        isSettingsEnabled.value = true;
    };

    // ловим и обрабатываем события из дочерней компоненты SettingsOverlay.vue
    function handleEvent(val_) {
        if (val_ == 'goBackToMainMenu') {
            isSettingsEnabled.value = false;
        };
    };
</script>


<style scoped lang="scss">
    .menu-container {
        text-align: center;
        color: white;
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
        margin: 0 0 30px 0;
        text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
    }

    .menu-btns {
        display: flex;
        flex-direction: column;
        padding: 20px;
    }

    .menu-btn {
        background: none;
        text-transform: uppercase;
        color: white;
        border: none;
        padding: 10px;
        margin: 10px 0;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.1s ease;

        &:hover {
            opacity: 0.75;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
        }
    }

    /* SETTINGS */
    .settings {
        display: flex;
        flex-direction: column;
        gap: 25px;
        margin: 30px 0;
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