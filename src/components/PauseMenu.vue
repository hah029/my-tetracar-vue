<template>
    <div v-if="isVisible" class="container">
        <div v-if="!isSettingsEnabled" class="pause_container">

            <Transition name="header_footer_block_anim">
                <div v-if="isHeaderShown" class="header_block">
                    <div class="header_text corr_header_size">{{ dynamicTitleName }}</div>
                    <div class="header_image">
                        <img class='image' src="@/assets/images/title_line_image.svg">
                    </div>
                </div>
            </Transition>

            <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group">
                <button v-for="(btn, index) in menuButtons" v-if="isPauseButtonsEnabled" :key="btn.id" class="menu_btn"
                    :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
                    {{ btn.text }}
                </button>
            </TransitionGroup>

        </div>

        <SettingsOverlay v-if="isSettingsEnabled" @event="handleEvent" />
    </div>
</template>


<script setup lang="ts">
    import { onMounted, ref, defineEmits, computed } from "vue";
    import { useGameState } from "@/store/gameState";
    import SettingsOverlay from "./settings/SettingsOverlay.vue";
    import { GameStates } from "@/game/core/GameState";
    import { createNewText } from '@/helpers/functions';

    // подключаем store
    const gameStore = useGameState();

    // подключаем emit
    const emit = defineEmits(['event']);

    const isSettingsEnabled = ref(false);
    const isHeaderShown = ref(false);
    const isPauseButtonsEnabled = ref(false);
    const isVisible = computed(() => gameStore.currentState === GameStates.Pause);

    const foo = createNewText();

    const menuButtons = computed(() => [
        { id: 1, text: foo.makeText("pauseMenu.menuList.resume"), action: resumeGame },
        { id: 2, text: foo.makeText("pauseMenu.menuList.settings"), action: goToSettings },
        { id: 3, text: foo.makeText("pauseMenu.menuList.menu"), action: goToMainMenu },
    ]);

    const dynamicTitleName = computed(() => {
        return foo.makeText("pauseMenu.title", 'empty');
    });

    // события на клик по кнопке "Продолжить"
    function resumeGame() {
        gameStore.setState(GameStates.Play);
        emit('event', 'resumeGame');
    };

    // события на клик по кнопке "Выйти в меню"
    function goToMainMenu() {
        gameStore.setState(GameStates.Menu);
        emit('event', 'returnToMenu');
    };

    // события на клик по кнопке "Настройки"
    function goToSettings() {
        isPauseButtonsEnabled.value = false;

        setTimeout(() => {
            isSettingsEnabled.value = true;
            // emit('event', 'switchToSettings');
        }, 300);
    };

    // ловим и обрабатываем события из дочерней компоненты SettingsOverlay.vue
    function handleEvent(val_) {
        if (val_ == 'goBackToMainMenu') {
            isSettingsEnabled.value = false;
            isHeaderShown.value = false;
            isPauseButtonsEnabled.value = true;
        };
    };

    // монтируем компоненту
    onMounted(() => {
        emit('event', 'activateBackground');
        isHeaderShown.value = true;

        setTimeout(() => {
            isPauseButtonsEnabled.value = true;
        }, 200);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";

    .pause_container {
        justify-content: flex-start;
        margin-top: 16.875rem;
    }

    .corr_header_size {
        font-size: 3.125rem !important;
    }

    .buttons_group {
        height: fit-content;
        display: flex;
        flex-direction: column;
        background: none;
        border: none;
        margin-top: 2.4rem;

        // имитируем row-gap (между кнопками)
        &>*+* {
            margin-top: 1.56rem;
        }
    }

    .menu_btn {
        background: none;
        border: none;
        // ---
        font-family: 'vla_shu';
        font-size: 1.875rem;
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
</style>