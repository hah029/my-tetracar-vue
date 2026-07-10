<template>
    <div class="container">
        <button class="menu_btn btn_correction" 
            :class="{ 'button-enter': isEntering, 'leaving': isLeaving }" @animationend="onAnimationEnd" @click="letsPlay">
            {{ splashScreenText }}
        </button>
    </div>
</template>


<script setup lang="ts">
    import { GameStates } from "@/game/core/GameState";
    import { useGameState } from "@/store/gameState";
    import { useDevice } from '@/composables/useDevice';
    import { createNewText } from '@/helpers/functions';
    import { onMounted, ref, computed } from "vue";

    // подключаем store
    const gameState = useGameState();
    const foo = createNewText();
    const isEntering = ref(false);      // флаг для анимации появления
    const isLeaving = ref(false);       // флаг для анимации исчезновения
    const { deviceType } = useDevice();

    // выводим текст в зависимости от типа устройства
    const splashScreenText = computed(() => {
        if (deviceType.value==='mobile' || deviceType.value==='tablet') {
            return foo.makeText("preloader.pressAnyButtonMob");
        } else if (deviceType.value==='laptop' || deviceType.value==='desktop') {
            return foo.makeText("preloader.pressAnyButton");
        };
    });

    // переходим в главное меню
    function letsPlay() {
        // смещаем лого наверх
        isLeaving.value = true;
        isEntering.value = false;

        // переходим в главное меню
        setTimeout(() => {
            gameState.isPreloaderShown = false;
            gameState.setState(GameStates.Menu);
        }, 150);
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
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;

    .btn_correction {
        position: absolute;
        bottom: 30.435%;
        opacity: 0;
        transition: all 0.2s ease-in-out;
        
        @include text-splash-button;
        color: $color-yellow-super-light;
    }

    // появление надписи + ее мерцание (пока пользователь не нажмет на кнопку)
    .btn_correction.button-enter {
        animation: 
            buttonFadeIn 1.5s ease-in-out forwards,
            enhancedBreathing 2s ease-in-out infinite;  // бесконечное мерцание
        animation-delay: 1.5s, 3.5s;  // задержки по анимациям (соответствено их порядку)
    }

    // исчезновение надписи
    .btn_correction.leaving {
        animation: buttonFadeOut 300ms ease-in-out forwards;
        animation-delay: 0s;
    }

    /* анимация появления надписи */
    @keyframes buttonFadeIn {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }

    /* анимация исчезновения надписи */
    @keyframes buttonFadeOut {
        0% {
            opacity: 1;
            filter: drop-shadow(0 0 1.25rem rgba(255, 246, 25, 0.4));
        }
        100% {
            opacity: 0;
            filter: drop-shadow(0 0 1.25rem rgba(255, 246, 25, 0));
        }
    }

    /* анимация постоянного мерцания надписи */
    @keyframes enhancedBreathing {
        0% {
            filter: drop-shadow(0 0 1.25rem rgba(255, 246, 25, 1));
        }
        50% {
            filter: drop-shadow(0 0 1.25rem rgba(255, 246, 25, 0.2));
        }
        100% {
            filter: drop-shadow(0 0 1.25rem rgba(255, 246, 25, 1));
        }
    }
</style>
