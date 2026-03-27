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

        <!-- Кнопки с TransitionGroup -->
        <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group group_correction">
            <button 
                v-for="(btn, index) in menuButtons" 
                v-if="isButtonsShown" 
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

    const menuButtons = computed(() => [
        { id: 1, text: foo.makeText("pauseMenu.menuList.resume"), action: resumeGame },
        { id: 2, text: foo.makeText("pauseMenu.menuList.settings"), action: goToSettings },
        { id: 3, text: foo.makeText("pauseMenu.menuList.menu"), action: goToMainMenu },
    ]);

    const dynamicTitleName = computed(() => foo.makeText("pauseMenu.title", 'empty'));

    function showHideAllPauseElements(type_) {
        isHeaderShown.value = type_;
        setTimeout(() => {
            isButtonsShown.value = type_;
        }, 100);
    };

    function resumeGame() {
        showHideAllPauseElements(false);
        setTimeout(() => {
            gameStore.setState(GameStates.Play);
        }, 400);
    };

    function goToMainMenu() {
        showHideAllPauseElements(false);
        setTimeout(() => {
            gameStore.setState(GameStates.Menu);
        }, 400);
    };

    function goToSettings() {
        isButtonsShown.value = false;
        setTimeout(() => {
            gameStore.openSettings();
        }, 400);
    };

    watch(
        () => gameStore.activeOverlay,
        (newState) => {
            if (newState !== 'settings') {
                showHideAllPauseElements(true);
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

    .container_correction {
        // justify-content: center !important;
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