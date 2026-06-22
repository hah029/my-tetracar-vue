<template>
    <Transition name="game_logo_whole_menu_showing">
        <div v-show="isWholeLogoShown" class="game_logo__root">
            <div class="background_animated" :class="backgroundClass"></div>
            <div class="gradient_bottom"></div>

            <div class="container">
                <Transition name="game_logo_showing">
                    <div v-if="isLettersShown" class="logo_group" :class="logoMoveClass" :style="logoStyle">
                        <div class="logo_left">
                            <img class='logo_img' src="@/assets/images/logo_tetro_back.svg">
                        </div>
                        <div class="logo_right">
                            <img class='logo_img' src="@/assets/images/logo_car_back.svg">
                        </div>
                    </div>
                </Transition>
                <Transition name="game_logo_showing">
                    <div v-if="isLettersShown" class="logo_group" :class="logoMoveClass" :style="logoStyle">
                        <div v-if="isLinesShown" class="logo_left neon_left" :class="neonClass">
                            <img class='logo_img neon_blue' src="@/assets/images/logo_tetro_lines.svg">
                        </div>
                        <div v-if="isLinesShown" class="logo_right neon_right" :class="neonClass">
                            <img class='logo_img neon_pink' src="@/assets/images/logo_car_lines.svg">
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useGameState } from "@/store/gameState";
import { GameStates } from "@/game/core/GameState";

const gameState = useGameState();

const isWholeLogoShown = ref(true);
const isLettersShown = ref(false);
const isLettersMovedToTop = ref(false);
const isLinesShown = ref(false);

watch(
    () => gameState.currentState,
    (state) => {
        switch (state) {
            case GameStates.Preloader:
                setTimeout(() => {
                    isLettersShown.value = true;
                }, 200);
                setTimeout(() => {
                    isLinesShown.value = true;
                }, 1000);
                break;

            case GameStates.Menu:
            case GameStates.LevelSelect:
                if (gameState.activeOverlay !== null) {
                    isWholeLogoShown.value = false;
                    break;
                }
                isWholeLogoShown.value = true;
                isLettersMovedToTop.value = true;
                isLettersShown.value = true;
                isLinesShown.value = true;
                break;

            case GameStates.Countdown:
            case GameStates.Play:
                isWholeLogoShown.value = false;
                break;

            case GameStates.Pause:
            case GameStates.Gameover:
                isWholeLogoShown.value = true;
                isLettersShown.value = false;
                break;
        }
    },
    { immediate: true },
);

const logoMoveClass = computed(() => {
    return (gameState.currentState === GameStates.Menu || gameState.currentState === GameStates.LevelSelect)
        && isLettersMovedToTop.value
        ? "logo_mooving"
        : "";
});

const logoStyle = computed(() => {
    const myPos = gameState.isPreloaderShown ? 18.47 : 13.04;
    return { top: `${myPos}%` };
});

const neonClass = computed(() => {
    return gameState.isPreloaderShown ? "neon_glow" : "";
});

const backgroundClass = computed(() => {
    return gameState.isPreloaderShown
        ? "fading_background"
        : "background_second_state";
});
</script>

<style lang='scss' scoped>
@use "@/styles/menu.scss" as *;
@use "@/styles/animations.scss";

.game_logo__root {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    z-index: z("game_logo__root");
}

.background_animated {
    position: absolute;
    left: 0;
    width: 100%;
    height: 200%;
    background: linear-gradient(to bottom, #000000 0%, #000000 50%, rgba(204, 183, 183, 0) 100%);
    z-index: z("background");
}

.background_second_state {
    top: -200%;
}

.fading_background {
    top: 0%;
    animation: fading_keys 3s forwards;
    animation-delay: 3.2s;
}

.gradient_bottom {
    position: fixed;
    bottom: 0%;
    width: 100%;
    height: 55%;
    background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.8));
    z-index: z("gradient");
}

.logo_group {
    position: absolute;
    width: min(81.25%, 1200px);
    aspect-ratio: 3 / 1;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: z("logo");
}

.logo_left {
    width: 50%;
}

.logo_right {
    width: 50%;
}

.logo_img {
    width: 100%;
    shape-rendering: geometricPrecision;
}

.neon_blue {
    filter: drop-shadow(0 0 20px rgba(121, 190, 255, 1));
}

.neon_pink {
    filter: drop-shadow(0 0 20px rgba(237, 37, 255, 1));
}
</style>
