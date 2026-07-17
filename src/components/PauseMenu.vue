<template>
    <div class="container container_blur">
        <div class="container" :class="setContainerClass()">
            <!-- SETTINGS OVERLAY -->
            <SettingsRoot v-if="gameStore.activeOverlay === 'settings'" :key="'settings'" />

            <!-- PAUSE MENU -->
            <div v-if="gameStore.activeOverlay !== 'settings'" :key="'pause'" class="container">
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
                <TransitionGroup v-if="gameStore.activeOverlay !== 'quitConfirm'" name="buttons_group_showing" tag="div"
                    class="buttons_group group_correction">
                    <button v-for="(btn, index) in menuButtonsPause" v-if="isButtonsShown" :key="btn.id"
                        class="menu_btn btn_correction" :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
                        {{ btn.text }}
                    </button>
                </TransitionGroup>

                <!-- Кнопки диалогового окна "Завершить игру?" -->
                <TransitionGroup v-if="gameStore.activeOverlay === 'quitConfirm'" name="buttons_group_showing" tag="div"
                    class="buttons_group group_correction">
                    <span v-if="isWarningShown" class="warning">{{ foo.makeText('quitConfirm.warning', 'empty') }}</span>
                    <button v-for="(btn, index) in menuButtonsQuitConfirm" v-if="isConfirmButtonsShown" :key="btn.id"
                        class="menu_btn btn_correction" :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
                        {{ btn.text }}
                    </button>
                </TransitionGroup>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
    import { onMounted, watch, computed, ref } from "vue";
    import { useGameState } from "@/store/gameState";
    import { useDevice } from '@/composables/useDevice';
    import SettingsRoot from "./settings/SettingsRoot.vue";
    import { GameStates } from "@/game/core/GameState";
    import { createNewText } from '@/helpers/functions';
    import { useProgressStore } from "@/store/progressStore";

    const gameStore = useGameState();
    const foo = createNewText();

    const isHeaderShown = ref(false);
    const isButtonsShown = ref(false);
    const isSettingsPreparing = ref(false);
    const isConfirmButtonsShown = ref(false);
    const isWarningShown = ref(false);
    const progressStore = useProgressStore();
    const { deviceType } = useDevice();

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
        isSettingsPreparing.value = false;

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
    function hideQuitConfirmMenu() {
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
            // возвращаем назад старое значение рекорда, если игрок не доиграл до конца (заблаговременно вышел)
            progressStore.restoreProgress();
            gameStore.setState(GameStates.Menu);
        }, 400);
        setTimeout(() => {
            gameStore.activeOverlay = null;
        }, 500);
    };

    // переходим в настройки
    function goToSettings() {
        isButtonsShown.value = false;
        isSettingsPreparing.value = true;
        setTimeout(() => {
            gameStore.openSettings();
        }, 400);
    };

    // перемещаем весь контейнер вверх/вниз (для мобильной версии)
    function setContainerClass() {
        if (!isSettingsPreparing.value) {
            // 1. вхожу в паузу 
            // 2. или выхожу из настроек
            return 'container_correction_pause';
        } else {
            // готовлюсь ко входу в настройки
            if (deviceType.value =='mobile') {
                return 'container_correction_settings';
            } else {
                return 'container_correction_pause';
            };
        };
    };

    // следим за стостоянием оверлея
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
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;

    .container_blur {
        background-color: rgba(0, 0, 0, 0.72);
        backdrop-filter: blur(2px);
    }

    .warning {
        font-family: 'jost-light';
        text-transform: uppercase;
        font-size: clamp(1rem, 2vmin, 1.375rem);
        color: #F79CFF;
        width: min(25rem, 90vw);
        text-align: center;
        margin-bottom: 1.563rem;
    }

    .group_correction {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 3.846vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            gap: 3.846vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     gap: 5.56vw; 
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            gap: 1.25vw; 
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            gap: 1.302vw;
        }
    }

    .header_correction {
        @include text-menu-title-pause;
    }

    .btn_correction {
        @include text-secondary-menu-button;
        color: $color-yellow-super-light;
    }
</style>
