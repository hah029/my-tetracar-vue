<template>
    <div class="menu-overlay">
        <div class="gradient"></div>

        <Transition name="letters_showing">
            <div v-if="isLettersShown" class="container">
                <div class="logo_group">
                    <div class="logo_left">
                        <img class='logo_img' src="@/assets/images/logo_tetro_back.svg">
                    </div>
                    <div class="logo_right">
                        <img class='logo_img' src="@/assets/images/logo_car_back.svg">
                    </div>
                </div>
                <div class="logo_group">
                    <div v-if="isLinesShown" class="logo_left neon_glow neon_left">
                        <img class='logo_img neon_blue' src="@/assets/images/logo_tetro_lines.svg">
                    </div>
                    <div v-if="isLinesShown" class="logo_right neon_glow neon_right">
                        <img class='logo_img neon_pink' src="@/assets/images/logo_car_lines.svg">
                    </div>
                </div>
                <Transition name="letters_showing">
                    <button v-if="isButtonShown" class="menu_btn" @click="letsPlay">- Нажми на кнопку -</button>
                </Transition>
            </div>
        </Transition>

    </div>
</template>


<script setup lang="ts">
    import { GAME_STATES as GS, useGameState } from "@/store/gameState";
    import { onMounted, ref, Transition } from "vue";

    // Подключаем store
    const gameStore = useGameState();

    let isLettersShown = ref(false);
    let isLinesShown = ref(false);
    let isButtonShown = ref(false);

    function letsPlay() {
        gameStore.setState(GS.MENU);
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
        }, 3800);
    });
</script>


<style lang="scss" scoped>
    .container {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        width: 100vw;
        height: 100vh;
    }

    .logo_group {
        position: absolute;
        top: 18.47%;
        width: 81.25%;
        height: 49.13%;
        display: flex;
        align-items: center;
        justify-content: space-between;
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

    .gradient {
        position: absolute;
        bottom: 0%;
        width: 100%;
        height: 50%;
        background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.8));
    }

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
            filter: drop-shadow(0 0 20px rgba(255, 246, 25, 0.6));
            transition: all 0.2s ease-in-out;
            animation: enhancedBreathing 2s ease-in-out infinite;
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

    // анимация появления текста логотипа из темноты при старте игры
    .letters_showing-enter-active {
        transition: all ease-in-out 3s;
        transition-delay: 1s;
    }
    .letters_showing-enter-from {
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
</style>