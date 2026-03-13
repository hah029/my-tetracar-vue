<template>
    <div class="container">
        <button v-if="isButtonShown" 
            class="menu_btn" 
            :class="{
                'button-enter': isEntering,     // класс для анимации появления
                'leaving': isLeaving            // класс для анимации исчезновения
            }" 
            @click="letsPlay"
            @animationend="onAnimationEnd">
                - Нажми на кнопку 
        -</button>
    </div>
</template>


<script setup lang="ts">
    import { GAME_STATES as GS, useGameState } from "@/store/gameState";
    import { onMounted, defineEmits, ref } from "vue";

    // подключаем store
    const gameStore = useGameState();

    // подключаем emit
    const emit = defineEmits(['event']);

    let isButtonShown = ref(false);
    const isEntering = ref(false);      // флаг для анимации появления
    const isLeaving = ref(false);       // флаг для анимации исчезновения


    function letsPlay() {
        // скрываем кнопку
        isButtonShown.value = false;
        
        isLeaving.value = true;
        isEntering.value = false;
        
        // // смещаем лого наверх
        emit('event', 'moving');
        // isLettersStatic.value = true;

        // переходим в главное меню
        setTimeout(() => {
            gameStore.setState(GS.MENU);
        }, 2000);
    };

    function onAnimationEnd(event: AnimationEvent) {
        // Проверяем, какая анимация закончилась
        if (event.animationName === 'buttonFadeOut') {
            // Анимация исчезновения завершена
            isButtonShown.value = false;
            isLeaving.value = false;
            gameStore.setState(GS.MENU);
        }
        
        if (event.animationName === 'buttonFadeIn') {
            // Анимация появления завершена
            isEntering.value = false;
        }
    }

    // // смещаем логотип при переходе в главное меню
    // function changeLogoPos() {
    //     if (isLettersStatic.value == true) {
    //         return 'logo_mooving';
    //     };
    // };

    onMounted(() => {
        emit('event', 'showing');
        // // плавно показываем саму массу букв
        // isLettersShown.value = true;

        // // вводим мерцанием левую часть неоновых линий
        // setTimeout(() => {
        //     isLinesShown.value = true;
        // }, 2000);

        // выводим кнопку
        setTimeout(() => {
            isButtonShown.value = true;

            // Запускаем анимацию появления в следующем тике
            setTimeout(() => {
                isEntering.value = true;
            }, 50);
        }, 4500);
    });
</script>


<style lang="scss" scoped>
    @use "@/styles/menu.scss";

    .menu_btn {
        z-index: 2500;
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

        opacity: 0;
        // transform: scale(0.8);
        // animation: buttonFadeIn 1.5s ease-in-out forwards;
        // animation-delay: 1s;

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
    .menu_btn.button-enter {
        animation: buttonFadeIn 1.5s ease-in-out forwards;
        animation-delay: 1s;
    }

    // класс для анимации исчезновения
    .menu_btn.leaving {
        animation: buttonFadeOut 2.5s ease-in-out forwards;
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
</style>