<template>
    <div class="container">
        <SettingsOverlay v-if="gameStore.activeOverlay === 'settings'" />
        <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group">
            <button 
                v-for="(btn, index) in menuButtons" 
                v-if="isMainMenuEnabled"
                key="btn.id" 
                class="menu_btn"
                :style="{ animationDelay: `${index * 0.06}s` }" 
                @click="btn.action"
            >
                {{ btn.text }}
            </button>
        </TransitionGroup>
    </div>
</template>


<script setup lang="ts">
    import { ref, computed, onMounted } from "vue";
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

    onMounted(() => {
        isMainMenuEnabled.value = true;
    });
</script>


<style lang="scss" scoped>
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";

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
</style>