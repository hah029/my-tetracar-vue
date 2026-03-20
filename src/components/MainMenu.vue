<template>
    <div class="container">
        <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group">
            <button v-for="(btn, index) in menuButtons" v-if="isMainMenuEnabled" :key="btn.id" class="menu_btn"
                :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
                {{ btn.text }}
            </button>
        </TransitionGroup>

        <SettingsOverlay v-if="isSettingsEnabled" @event="handleEvent" />
    </div>
</template>


<script setup lang="ts">
import { ref, defineEmits, onMounted, computed } from "vue";
import { useGameState } from "@/store/gameState";
import SettingsOverlay from "./settings/SettingsOverlay.vue";
import { GameStates } from "@/game/core/GameState";
import { createNewText } from '@/helpers/functions';

const foo = createNewText();

// подключаем store
const gameStore = useGameState();

// подключаем emit
const emit = defineEmits(['event']);

const isMainMenuEnabled = ref(false);
const isSettingsEnabled = ref(false);

const menuButtons = computed(() => [
    { id: 1, text: foo.makeText("mainMenu.startGame"), action: startGame },
    { id: 2, text: foo.makeText("mainMenu.shop"), action: null },
    { id: 3, text: foo.makeText("mainMenu.settings"), action: goToSettings },
    { id: 4, text: foo.makeText("mainMenu.leaderboards"), action: null },
]);

function startGame() {
    emit('event', 'startGame');
    gameStore.setState(GameStates.Countdown);
};

function goToSettings() {
    isMainMenuEnabled.value = false;
    setTimeout(() => {
        isSettingsEnabled.value = true;
    }, 300);
};

// ловим и обрабатываем события из дочерней компоненты SettingsOverlay.vue
function handleEvent(val_) {
    if (val_ == 'goBackToMainMenu') {
        isSettingsEnabled.value = false;
        isMainMenuEnabled.value = true;
    };
};

onMounted(() => {
    isMainMenuEnabled.value = true;
});
</script>


<style lang="scss" scoped>
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";

.buttons_group {
    position: absolute;
    bottom: 19.57%;
    height: fit-content;
    display: flex;
    flex-direction: column;
    background: none;
    border: none;

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