<template>
    <div class="container">
        <SettingsOverlay v-if="gameStore.activeOverlay === 'settings'" />
        <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group group_correction">
            <button 
                v-for="(btn, index) in menuButtons" 
                v-if="isMainMenuEnabled"
                key="btn.id" 
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
    import { watch, ref, computed, onMounted } from "vue";
    import { useGameState } from "@/store/gameState";
    import { GameStates } from "@/game/core/GameState";
    import { createNewText } from '@/helpers/functions';
    import SettingsOverlay from "./settings/SettingsOverlay.vue";

    const foo = createNewText();

    // подключаем store
    const gameStore = useGameState();

    const isMainMenuEnabled = ref(false);

    const menuButtons = computed(() => [
        { id: 1, text: foo.makeText("mainMenu.startGame"), action: startGame },
        { id: 2, text: foo.makeText("mainMenu.shop"), action: null },
        { id: 3, text: foo.makeText("mainMenu.settings"), action: goToSettings },
        { id: 4, text: foo.makeText("mainMenu.leaderboards"), action: null },
    ]);

    function startGame() {
        gameStore.setState(GameStates.Countdown);
    };

    function goToSettings() {
        isMainMenuEnabled.value = false;
        setTimeout(() => {
            gameStore.openSettings();
        }, 300);
    };

    watch(
        () => gameStore.activeOverlay,
        (newState) => {
            newState === 'settings' ? "" : isMainMenuEnabled.value = true;
        },
    );

    onMounted(() => {
        isMainMenuEnabled.value = true;
    });
</script>


<style lang="scss" scoped>
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";

    .group_correction {
        bottom: 19.57%;

        &>*+* {
            margin-top: 1.56rem; // 25px - row-gap (между кнопками)
        }
    }

    .btn_correction {
        font-size: 2.1875rem; // (35px)
    }
</style>