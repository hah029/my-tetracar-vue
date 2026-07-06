<template>
    <div class="container">
        <button class="menu_btn btn_correction" :class="{
            'button-enter': isEntering,     // класс для анимации появления
            'leaving': isLeaving            // класс для анимации исчезновения
        }" @click="letsPlay" @animationend="onAnimationEnd">
            {{ splashScreenText }}
            <!-- {{ foo.makeText("preloader.pressAnyButton") }} -->
            <!-- {{ text("preloader.pressAnyButton") }} -->
        </button>
    </div>
</template>


<script setup lang="ts">
    import { GameStates } from "@/game/core/GameState";
    import { useGameState } from "@/store/gameState";
    import { createNewText } from '@/helpers/functions';
    import { onMounted, onUnmounted, ref, computed } from "vue";

    // подключаем store
    const gameState = useGameState();
    const foo = createNewText();

    const isEntering = ref(false);      // флаг для анимации появления
    const isLeaving = ref(false);       // флаг для анимации исчезновения

    // #region - Определение устройства
    const isDesktop = ref(false);
    const isTablet = ref(false);
    const isMobile = ref(true); // по умолчанию true

    function updateDevice() {
        const width = window.innerWidth;
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        
        // Определяем по ширине (Mobile-first)
        isDesktop.value = width >= 1920 && isLandscape;
        isTablet.value = width >= 1024 && width < 1920 && isLandscape;
        isMobile.value = width < 1024 && isLandscape;
    };
    
    let resizeCleanup: (() => void) | null = null;
    // #endregion

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
        updateDevice();
        const handler = () => updateDevice();
        window.addEventListener('resize', handler);
        resizeCleanup = () => window.removeEventListener('resize', handler);

        // выводим кнопку
        setTimeout(() => {
            setTimeout(() => {
                isEntering.value = true;
            }, 50);
        }, 3200);
    });

    onUnmounted(() => {
        if (resizeCleanup) resizeCleanup();
    });

    // выводим текст в зависимости от типа устройства
    const splashScreenText = computed(() => {
        if (isMobile.value || isTablet.value) {
            // Mobile-first: базовые значения для мобильных (или, в данном случае, еще и для планшетов)
            return foo.makeText("preloader.pressAnyButtonMob");
        } else if (isDesktop.value) {
            // Десктоп
            return foo.makeText("preloader.pressAnyButton");
        };
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
