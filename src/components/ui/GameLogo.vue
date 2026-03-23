<template>
    <Transition name="game_logo_whole_menu_showing">
        <div v-show="isWholeLogoShown" class="menu_overlay">
            <div class="background" :class="backgroundClass"></div>
            <div class="gradient"></div>

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

    // подключаем store
    const gameState = useGameState();

    // ===== UI STATE =====
    const isWholeLogoShown = ref(true);
    const isLettersShown = ref(false);
    const isLettersMovedToTop = ref(false);
    const isLinesShown = ref(false);

    // ===== STATE MACHINE =====
    // (сценарии работы с логотипом)
    watch(
        () => gameState.currentState,
        (state, _) => {
            switch (state) {

                // ===== PRELOADER =====
                case GameStates.Preloader:
                    // выводим логотип при загрузке игры
                    setTimeout(() => {
                        isLettersShown.value = true;
                    }, 200);
                    setTimeout(() => {
                        isLinesShown.value = true;  // вводим мерцанием левую (а потом правую) часть неоновых линий
                    }, 1000);
                    break;

                // ===== MENU =====
                case GameStates.Menu:
                    if (gameState.activeOverlay === 'settings') {
                        // возвращаемся в Главное меню
                        isWholeLogoShown.value = true;
                    } else {
                        // смещаем логотип вверх (при входе в главное меню)
                        isLettersMovedToTop.value = true;
                    };
                    break;

                // ===== START GAME =====
                case GameStates.Countdown:
                case GameStates.Play:
                    // стартуем гонку
                    isWholeLogoShown.value = false;
                    break;

                // ===== PAUSE =====
                case GameStates.Pause:
                    isWholeLogoShown.value = true;
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

    

    // смещаем логотип при переходе из Прелоадера в Главное меню
    const logoMoveClass = computed(() => {
        return gameState.currentState == 'menu' && isLettersMovedToTop.value
            ? "logo_mooving"
            : "";
    });

    // определяем местоположение логотипа (относ. верхн. границы экрана)
    const logoStyle = computed(() => {
        let myPos = gameState.isFirstGame ? 18.47 : 13.04;
        return { top: `${myPos}%` };
    });

    // активируем анимацию мерцания ламп логотипа в зависимости от сценария
    const neonClass = computed(() => {
        return gameState.isFirstGame ? "neon_glow" : "";
    });

    // динамические стили темного фона на заднем плане (фон поднимается вверх)
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
            background: linear-gradient(to bottom, #000000 0%, #000000 50%, rgba(204, 183, 183, 0) 100%);
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
            position: absolute;
            width: 81.25%;
            height: 49.13%;
            display: flex;
            align-items: center;
            justify-content: space-between;

            // position: relative;
            // width: 100%;
            // aspect-ratio: 3 / 1; // подгони под свой SVG
            // width: min(80vw, 700px); // 🔥 ограничение ширины
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
    // #endregion
</style>