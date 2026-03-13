<template>
    <div class="menu-overlay">
        <div class="fading_background"></div>
        <div class="gradient"></div>

        <div class="container">
            <Transition name="game_logo_showing">
                <div v-if="isLettersShown" class="logo_group" :class="changeLogoPos()">
                    <div class="logo_left">
                        <img class='logo_img' src="@/assets/images/logo_tetro_back.svg">
                    </div>
                    <div class="logo_right">
                        <img class='logo_img' src="@/assets/images/logo_car_back.svg">
                    </div>
                </div>
            </Transition>
            <Transition name="game_logo_showing">
                <div v-if="isLettersShown" class="logo_group" :class="changeLogoPos()">
                    <div v-if="isLinesShown" class="logo_left neon_glow neon_left">
                        <img class='logo_img neon_blue' src="@/assets/images/logo_tetro_lines.svg">
                    </div>
                    <div v-if="isLinesShown" class="logo_right neon_glow neon_right">
                        <img class='logo_img neon_pink' src="@/assets/images/logo_car_lines.svg">
                    </div>
                </div>
            </Transition>
            <Transition name="button_showing">
                <button v-if="isButtonShown" class="menu_btn" @click="letsPlay">- Нажми на кнопку -</button>
            </Transition>
        </div>
    </div>
</template>


<script setup lang="ts">
    import { GAME_STATES as GS, useGameState } from "@/store/gameState";
    import { onMounted, ref, Transition } from "vue";

    // Подключаем store
    const gameStore = useGameState();

    let isLettersShown = ref(false);
    let isLettersStatic = ref(false);
    let isLinesShown = ref(false);
    let isButtonShown = ref(false);

    function letsPlay() {
        // скрываем кнопку
        isButtonShown.value = false;
        
        // смещаем лого наверх
        isLettersStatic.value = true;
        // isLettersShown.value = false;

        // переходим в главное меню
        setTimeout(() => {
            gameStore.setState(GS.MENU);
        }, 2000);
    };

    // смещаем логотип при переходе в главное меню
    function changeLogoPos() {
        if (isLettersStatic.value == true) {
            return 'logo_mooving';
        };
    };

    onMounted(() => {
        // плавно показываем саму массу букв
        isLettersShown.value = true;

        // вводим мерцанием левую часть неоновых линий
        setTimeout(() => {
            isLinesShown.value = true;
        }, 2000);

        // выводим кнопку
        setTimeout(() => {
            isButtonShown.value = true;
        }, 4500);
    });
</script>


<style lang="scss" scoped>
    @use "@/styles/menu.scss";

    .menu_btn {
        position: absolute;
        bottom: 30.435%;
        height: fit-content;
        background: none;
        border: none;
        // ---
        font-family: 'vla_shu';
        font-size: 2.25rem; // (36px)
        color: #FDFFE3;
        filter: drop-shadow(0 0 15px rgba(255, 246, 25, 0.4));
        cursor: pointer;
        transition: all 0.2s ease-in-out;

        // Неоновое свечение с анимацией мерцания
        animation: enhancedBreathing 2s ease-in-out infinite;

        &:hover {
            transform: scale(1.02);
            color: #ffffff;
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.6));
            transition: all 0.2s ease-in-out;
            animation: enhancedBreathing 2s ease-in-out infinite;
        }
    }

    // #region - блок анимаций:
        // имитация появления дороги (сдвиг вверх черного градиентного фона)
        @keyframes fading_keys {
            from { 
                top: 0%;
            }
            to { 
                top: -200%;
            }
        }

        // постоянное свечение кнопки входа в игру
        @keyframes enhancedBreathing {
            0%, 100% {
                filter: drop-shadow(0 0 15px rgba(255, 246, 25, 0.4));
            }
            30% {
                filter: drop-shadow(0 0 0.75rem rgba(255, 246, 25, 0.25))
                        drop-shadow(0 0 1.0625rem rgba(255, 246, 25, 0.1));
            }
            60% {
                filter: drop-shadow(0 0 1.375rem rgba(255, 246, 25, 0.55))
                        drop-shadow(0 0 1.5625rem rgba(255, 246, 25, 0.2));
            }
            80% {
                filter: drop-shadow(0 0 1.1875rem rgba(255, 246, 25, 0.42))
                drop-shadow(0 0 1.1875rem rgba(255, 246, 25, 0.12));
                color: #ffffff;
            }
        }

        // анимация появления текста логотипа игры из темноты при старте игры
        .game_logo_showing-enter-active {
            transition: all ease-in-out 3s;
            transition-delay: 1s;
        }
        .game_logo_showing-enter-from {
            opacity: 0;
        }

        // анимация поднятия текста лого вверх при переходе в главное меню
        .logo_mooving {
            animation: logoMovingAnim 1s cubic-bezier(0, 0.6, 0.5, 1) forwards;
            animation-delay: 0.5s;
        }
        @keyframes logoMovingAnim {
            0% {
                top: 18.47%;
            }
            100% {
                top: 13.04%;
            }
        }

        // .game_logo_showing-leave-active {
        //     transition: all 1s cubic-bezier(0, 0.6, 0.5, 1);
        //     transition-delay: 0.5s;
        // }
        // .game_logo_showing-leave-to {
        //     transform: translateY(-10%);
        // }

        // анимации возникновения / исчезновения кнопки перехода в главное меню
        .button_showing-enter-active {
            transition: all ease-in-out 1.5s;
            transition-delay: 1s;
        }
        .button_showing-enter-from {
            opacity: 0;
        }
        .button_showing-leave-active {
            transition: all ease-in-out 2.5s;
        }
        .button_showing-leave-to {
            opacity: 0;
        }

        // анимации возникновения неоновых подсветкок логотипа
        .neon_glow {
            opacity: 0;
            animation: neonFlicker 3s ease-out forwards;
        }
        .neon_left {
            animation-delay: 0.4s;
        }
        .neon_right {
            animation-delay: 1.2s;
        }
        @keyframes neonFlicker {
            0% {
                opacity: 0;
            }
            2.22% {
                opacity: 0.8; /* вспышка */
            }
            4.44% {
                opacity: 0; /* затухание */
            }
            6.67% {
                opacity: 0.8; /* вспышка */
            }
            8.89% {
                opacity: 0; /* затухание */
            }
            35% {
                opacity: 0; /* пауза */
            }
            100% {
                opacity: 1; /* финальная постоянная яркость */
            }
        }
    // #endregion
</style>