<template>
    <div class="container">
        <button class="menu_btn btn_correction" :class="{
            'button-enter': isEntering,     // класс для анимации появления
            'leaving': isLeaving            // класс для анимации исчезновения
        }" @click="letsPlay" @animationend="onAnimationEnd">
            {{ foo.makeText("preloader.pressAnyButton") }}
            <!-- {{ text("preloader.pressAnyButton") }} -->
        </button>
    </div>
</template>


<script setup lang="ts">
    import { GameStates } from "@/game/core/GameState";
    import { useGameState } from "@/store/gameState";
    import { createNewText } from '@/helpers/functions';
    import { onMounted, ref } from "vue";

    // подключаем store
    const gameState = useGameState();
    const foo = createNewText();

    const isEntering = ref(false);      // флаг для анимации появления
    const isLeaving = ref(false);       // флаг для анимации исчезновения

    // переходим в главное меню
    function letsPlay() {
        // смещаем лого наверх
        isLeaving.value = true;
        isEntering.value = false;

        // переходим в главное меню
        setTimeout(() => {
            gameState.isFirstGame = false;
            gameState.setState(GameStates.Menu);
        }, 500);
    };

    function onAnimationEnd(event: AnimationEvent) {
        // Проверяем, какая анимация закончилась
        if (event.animationName === 'buttonFadeOut') {
            // Анимация исчезновения завершена
            // isLeaving.value = false;
            gameState.setState(GameStates.Menu);
        };

        if (event.animationName === 'buttonFadeIn') {
            // Анимация появления завершена
            isEntering.value = false;
        };
    };

    onMounted(() => {
        // выводим кнопку
        setTimeout(() => {
            setTimeout(() => {
                isEntering.value = true;
            }, 50);
        }, 3200);
    });
</script>


<style lang="scss" scoped>
    @use "@/styles/menu.scss";

    .btn_correction {
        z-index: 2500;
        position: absolute;
        bottom: 30.435%;
        height: fit-content;
        opacity: 0;

        font-size: 2.1875rem; // (35px)
        transition: all 0.2s ease-in-out;

        // Неоновое свечение с анимацией мерцания
        // animation: enhancedBreathing 2s ease-in-out infinite;

        &:hover {
            transform: scale(1.02);
            color: #ffffff;
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.6));
            transition: all 0.2s ease-in-out;
            // animation: enhancedBreathing 2s ease-in-out infinite;
        }
    }

    // класс для анимации появления
    .btn_correction.button-enter {
        animation: buttonFadeIn 1.5s ease-in-out forwards;
        animation-delay: 1s;
    }

    // класс для анимации исчезновения
    .btn_correction.leaving {
        animation: buttonFadeOut 300ms ease-in-out forwards;
        // animation-delay: 1s;
    }

    /* анимация появления */
    @keyframes buttonFadeIn {
        0% {
            opacity: 0;
        }

        100% {
            opacity: 1;
        }
    }

    /* анимация исчезновения */
    @keyframes buttonFadeOut {
        0% {
            opacity: 1;
        }

        100% {
            opacity: 0;
        }
    }

    // постоянное свечение кнопки входа в игру
    @keyframes enhancedBreathing {
        0%,
        100% {
            filter: drop-shadow(0 0 15px rgba(255, 246, 25, 0.4));
        }

        30% {
            filter: drop-shadow(0 0 0.75rem rgba(255, 246, 25, 0.25)) drop-shadow(0 0 1.0625rem rgba(255, 246, 25, 0.1));
        }

        60% {
            filter: drop-shadow(0 0 1.375rem rgba(255, 246, 25, 0.55)) drop-shadow(0 0 1.5625rem rgba(255, 246, 25, 0.2));
        }

        80% {
            filter: drop-shadow(0 0 1.1875rem rgba(255, 246, 25, 0.42)) drop-shadow(0 0 1.1875rem rgba(255, 246, 25, 0.12));
            color: #ffffff;
        }
    }
</style>