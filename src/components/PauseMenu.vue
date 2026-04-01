<template>
    <!-- SETTINGS OVERLAY -->
    <SettingsOverlay v-if="gameStore.activeOverlay === 'settings'" :key="'settings'" />

    <!-- PAUSE MENU -->
    <div v-if="gameStore.activeOverlay !== 'settings'" :key="'pause'" class="container container_correction">
        <!-- HEADER с анимацией -->
        <Transition name="header_footer_block_anim">
            <div v-if="isHeaderShown" class="header_block">
                <div class="header_text header_correction">{{ dynamicTitleName }}</div>
                <div class="header_image">
                    <img class='image' src="@/assets/images/title_line_image.svg" />
                </div>
            </div>
        </Transition>

        <!-- Кнопки меню "Пауза" -->
        <TransitionGroup v-if="gameStore.activeOverlay !== 'quitConfirm'"
            name="buttons_group_showing" tag="div" class="buttons_group group_correction"
        >
            <button 
                v-for="(btn, index) in menuButtonsPause" 
                v-if="isButtonsShown" 
                :key="btn.id"
                class="menu_btn btn_correction" 
                :style="{ animationDelay: `${index * 0.06}s` }" 
                @click="btn.action"
            >
                {{ btn.text }}
            </button>
        </TransitionGroup>

        <!-- Кнопки диалогового окна "Завершить игру?" -->
        <TransitionGroup v-if="gameStore.activeOverlay === 'quitConfirm'"
            name="buttons_group_showing" tag="div" class="buttons_group group_correction"
        >
            <span v-if="isWarningShown" class="warning">{{ foo.makeText('quitConfirm.warning', 'empty') }}</span>
            <button 
                v-for="(btn, index) in menuButtonsQuitConfirm" 
                v-if="isConfirmButtonsShown" 
                :key="btn.id"
                class="menu_btn btn_correction" 
                :style="{ animationDelay: `${index * 0.06}s` }" 
                @click="btn.action"
            >
                {{ btn.text }}
            </button>
        </TransitionGroup>
    </div>
</template>


<script setup lang="ts">
    import { onMounted, watch, computed, ref } from "vue";
    import { useGameState } from "@/store/gameState";
    import SettingsOverlay from "./settings/SettingsOverlay.vue";
    import { GameStates } from "@/game/core/GameState";
    import { createNewText } from '@/helpers/functions';

    const gameStore = useGameState();
    const foo = createNewText();

    const isHeaderShown = ref(false);
    const isButtonsShown = ref(false);
    const isConfirmButtonsShown = ref(false);
    const isWarningShown = ref(false);

    // кнопки меню "Пауза"
    const menuButtonsPause = computed(() => [
        { id: 1, text: foo.makeText("pauseMenu.menuList.resume"), action: resumeGame },
        { id: 2, text: foo.makeText("pauseMenu.menuList.settings"), action: goToSettings },
        { id: 3, text: foo.makeText("pauseMenu.menuList.menu"), action: showQuitConfirmMenu },
    ]);

    // кнопки диалогового окна "Завершить игру?"
    const menuButtonsQuitConfirm = computed(() => [
        { id: 1, text: foo.makeText("quitConfirm.menuList.stay"), action: hideQuitConfirmMenu },
        { id: 2, text: foo.makeText("quitConfirm.menuList.quit"), action: goToMainMenu },
    ]);

    // генерируем фразу для титула
    const dynamicTitleName = computed(() => {
        if (gameStore.activeOverlay == 'quitConfirm') {
            return foo.makeText("quitConfirm.title", 'empty');
        } else {
            return foo.makeText("pauseMenu.title", 'empty');
        };
    });

    // показываем (анимацией) титул и все кнопки меню
    function showHideAllPauseElements(type_, isQuitGame = false) {
        isHeaderShown.value = type_;

        if (isQuitGame) {
            isWarningShown.value = false;
            setTimeout(() => {
                isConfirmButtonsShown.value = false;
            }, 100);
        };
        
        setTimeout(() => {
            isButtonsShown.value = type_;
        }, 100);
    };

    // продолжаем игру
    function resumeGame() {
        showHideAllPauseElements(false);
        setTimeout(() => {
            gameStore.setState(GameStates.Play);
        }, 400);
    };

    // показываем диалоговое окно с подтверждением выхода из игры
    function showQuitConfirmMenu() {
        isButtonsShown.value = false;
        setTimeout(() => {
            gameStore.activeOverlay = 'quitConfirm';
        }, 400);
        setTimeout(() => {
            isWarningShown.value = true;
        }, 450);
        setTimeout(() => {
            isConfirmButtonsShown.value = true;
        }, 500);
    };

    // скрываем диалоговое окно с подтверждением выхода из игры
    function hideQuitConfirmMenu () {
        isWarningShown.value = false;
        setTimeout(() => {
            isConfirmButtonsShown.value = false;
        }, 100);
        setTimeout(() => {
            gameStore.activeOverlay = null;
        }, 500);
    };

    // переходим в главное меню
    function goToMainMenu() {
        showHideAllPauseElements(false, true);
        setTimeout(() => {
            gameStore.setState(GameStates.Menu);
        }, 400);
        setTimeout(() => {
            gameStore.activeOverlay = null;
        }, 500);
    };

    // переходим в настройки
    function goToSettings() {
        isButtonsShown.value = false;
        setTimeout(() => {
            gameStore.openSettings();
        }, 400);
    };

    watch(
        () => gameStore.activeOverlay,
        (newState) => {
            if (newState === null) {
                showHideAllPauseElements(true, true);
            };
        },
    );

    onMounted(() => {
        showHideAllPauseElements(true);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";

    .warning {
        font-family: 'jost';
        text-transform: uppercase;
        font-size: 1.375rem;
        color: #F79CFF;
        width: 25rem;
        text-align: center;
        margin-bottom: 1.563rem;
    }

    .container_correction {
        justify-content: flex-start !important;
        top: 19.75rem;
    }

    .group_correction {
        margin-top: 8.3125rem;
        
        &>*+* {
            margin-top: 1.56rem; // 25px - row-gap (между кнопками)
        }
    }
    
    .header_correction {
        font-size: 3.125rem; // (50px)
    }
    .btn_correction {
        font-size: 1.875rem; // (30px)
    }
</style>