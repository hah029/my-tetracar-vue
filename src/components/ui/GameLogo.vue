<template>
    <div class="menu_overlay">
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
        </div>
    </div>
</template>


<script setup lang="ts">
    import { ref, watch, Transition } from "vue";

    let isLettersShown = ref(false);
    let isLettersStatic = ref(false);
    let isLinesShown = ref(false);

    // инициализируем пропсы
    interface Props {
        handleParam: any;
    };

    const props = defineProps<Props>();

    // ловим и обрабатываем события из дочерней компоненты Preloader.vue
    watch(
        () => props.handleParam,
        (val_) => {
            // выводим логотип при загрузке игры
            if (val_ == 'showing') {
                // плавно показываем саму массу букв
                isLettersShown.value = true;
        
                // вводим мерцанием левую (а потом правую) часть неоновых линий
                setTimeout(() => {
                    isLinesShown.value = true;
                }, 2000);

            // смещаем логотип вверх (при входе в главное меню)
            } else if (val_ == 'moving') {
                isLettersStatic.value = true;
            };
        }
    );

    // смещаем логотип при переходе в главное меню
    function changeLogoPos() {
        if (isLettersStatic.value == true) {
            return 'logo_mooving';
        };
    };
</script>


<style lang='scss' scoped>
    @use "@/styles/menu.scss";

    // #region - основное
    .fading_background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 200%;
        background: linear-gradient(
            to bottom,
            #000000 0%,      /* Черный цвет вверху */
            #000000 50%,     /* Черный цвет до середины */
            rgba(0, 0, 0, 0) 100%  /* Прозрачность внизу */
        );
        animation: fading_keys 3s forwards;
        animation-delay: 4.4s;
    }

    .gradient {
        position: absolute;
        bottom: 0%;
        width: 100%;
        height: 35%;
        background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.8));
    }
    // #endregion

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
            animation: logoMovingAnim 0.7s cubic-bezier(0.42, 0, 1, 1) forwards;
        }
        @keyframes logoMovingAnim {
            0% {
                top: 18.47%;
            }
            100% {
                top: 13.04%;
            }
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