<template>
    <div class="wrapper" v-show="isWholeLogoShown">
        <div class="logo">
            <!-- <Transition name="game_logo_showing"> -->
            <div class="logo_group" :class="logoMoveClass">
                <!-- BASE -->
                <div v-if="isLettersShown" class="logo_tetro">
                    <img class="logo__img" src="@/assets/images/logo_tetro_back.svg" />
                </div>
                <div v-if="isLettersShown" class="logo_car">
                    <img class="logo__img" src="@/assets/images/logo_car_back.svg" />
                </div>
                <!-- NEON -->
                <div v-if="isLinesShown" class="logo_tetro neon_left" :class="neonClass">
                    <img class="logo__img neon_blue" src="@/assets/images/logo_tetro_lines.svg" />
                </div>
                <div v-if="isLinesShown" class="logo_car neon_right" :class="neonClass">
                    <img class="logo__img neon_pink" src="@/assets/images/logo_car_lines.svg" />
                </div>
            </div>
            <!-- </Transition> -->

            <!-- <Transition name="game_logo_showing">
                <div v-if="isLettersShown" class="logo_group" :class="logoMoveClass" :style="logoStyle"> </div>
            </Transition> -->
        </div>
        <div class="background" :class="backgroundClass"></div>
        <div class="gradient"></div>
    </div>
    <!-- <Transition name="game_logo_whole_menu_showing">
    </Transition> -->
</template>


<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useGameState } from "@/store/gameState";
import { GameStates } from "@/game/core/GameState";

// store
const gameState = useGameState();

// ===== UI STATE =====
const isWholeLogoShown = ref(true);
const isLettersShown = ref(false);
const isLettersMovedToTop = ref(false);
const isLinesShown = ref(false);

// ===== STATE MACHINE =====
watch(
    () => gameState.currentState,
    (state, _) => {
        switch (state) {
            // ===== PRELOADER =====
            case GameStates.Preloader:
                isWholeLogoShown.value = true;
                isLettersShown.value = true;
                isLinesShown.value = true;

                // setTimeout(() => {
                // }, 1000);
                break;

            // ===== MENU =====
            case GameStates.Menu:
                if (gameState.activeOverlay === 'settings') {
                    isWholeLogoShown.value = false;
                } else {
                    isWholeLogoShown.value = true;
                }
                break;

            // ===== START GAME =====
            case GameStates.Countdown:
            case GameStates.Play:
                isWholeLogoShown.value = false;
                break;

            // ===== PAUSE =====
            case GameStates.Pause:
                isWholeLogoShown.value = false;
                isLettersShown.value = false;
                break;

            // // ===== GAME OVER =====
            // case GameStates.Gameover:
            //     isWholeLogoShown.value = true;
            //     break;
        }
    },
    { immediate: true }
);

// ===== COMPUTED =====

// позиция логотипа
// const logoStyle = computed(() => {
//     const top = gameState.isFirstGame ? 18.47 : 13.04;
//     return { top: `${top}%` };
// });

// класс смещения
const logoMoveClass = computed(() => {
    return gameState.isFirstGame && isLettersMovedToTop.value
        ? "logo_mooving"
        : "";
});

// неоновая анимация
const neonClass = computed(() => {
    return gameState.isFirstGame ? "neon_glow" : "";
});

// фон
const backgroundClass = computed(() => {
    return gameState.isFirstGame
        ? "fading_background"
        : "background_second_state";
});
</script>


<style lang='scss' scoped>
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";



// #region - фон
.background {
    position: absolute;
    left: 0;
    width: 100%;
    height: 200%;
    background: linear-gradient(to bottom,
            #000000 0%,
            /* Черный цвет вверху */
            #000000 50%,
            /* Черный цвет до середины */
            rgba(204, 183, 183, 0) 100%
            /* Прозрачность внизу */
        );
}

.background_second_state {
    top: -200%;
}

.fading_background {
    top: 0%;
    animation: fading_keys 3s forwards; // (лежит в animations.scss)
    animation-delay: 3.2s;
}

.gradient {
    position: fixed;
    bottom: 0%;
    width: 100%;
    height: 55%;
    background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.8));
}

// #endregion

// #region - буквенный логотип
.logo_group {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 1; // подгони под свой SVG
}



.logo_tetro {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 50%;
}

.logo_car {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 50%;
}

.logo__img {
    width: 100%;
    shape-rendering: geometricPrecision;
}

.neon_blue {
    filter: drop-shadow(0 0 20px rgba(121, 190, 255, 1));
}

.neon_pink {
    filter: drop-shadow(0 0 20px rgba(237, 37, 255, 1));
}

.wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
}

.logo {
    width: min(80vw, 700px); // 🔥 ограничение ширины
}

// #endregion</style>