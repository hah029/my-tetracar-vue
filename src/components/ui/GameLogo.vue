<template>
    <Transition name="game_logo_whole_menu_showing">
        <div v-show="isWholeLogoShown" class="menu_overlay">
            <div class="background" :class="switchBackgroundStyle()"></div>
            <div class="gradient"></div>
    
            <div class="container">
                <Transition name="game_logo_showing">
                    <div v-if="isLettersShown" class="logo_group" :class="changeLogoPos()" :style="setLogoPosition()">
                        <div class="logo_left">
                            <img class='logo_img' src="@/assets/images/logo_tetro_back.svg">
                        </div>
                        <div class="logo_right">
                            <img class='logo_img' src="@/assets/images/logo_car_back.svg">
                        </div>
                    </div>
                </Transition>
                <Transition name="game_logo_showing">
                    <div v-if="isLettersShown" class="logo_group" :class="changeLogoPos()" :style="setLogoPosition()">
                        <div v-if="isLinesShown" class="logo_left neon_left" :class="acivateNeonAnimation()">
                            <img class='logo_img neon_blue' src="@/assets/images/logo_tetro_lines.svg">
                        </div>
                        <div v-if="isLinesShown" class="logo_right neon_right" :class="acivateNeonAnimation()">
                            <img class='logo_img neon_pink' src="@/assets/images/logo_car_lines.svg">
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    </Transition>
</template>


<script setup lang="ts">
    import { ref, watch, Transition } from "vue";
    import { useGameState } from "@/store/gameState";

    let isWholeLogoShown = ref(true);
    let isLettersShown = ref(false);
    let isLettersMovedToTop = ref(false);
    let isLinesShown = ref(false);

    // подключаем store
    const gameState = useGameState();

    // инициализируем пропсы
    interface Props {
        handleParam: any;
    };

    const props = defineProps<Props>();

    // сценарии работы с логотипом
    //      (ловим и обрабатываем события из разных внешних компонентов)
    watch(
        () => props.handleParam,
        (val_) => {
            
            if (val_ == 'showing') {
                // выводим логотип при загрузке игры
                isLettersShown.value = true;    // плавно показываем саму массу букв
        
                setTimeout(() => {
                    isLinesShown.value = true;  // вводим мерцанием левую (а потом правую) часть неоновых линий
                }, 1000);

            } else if (val_ == 'moving') {
                // смещаем логотип вверх (при входе в главное меню)
                isLettersMovedToTop.value = true;

            } else if (val_ == 'startGame') {
                // стартуем гонку
                isWholeLogoShown.value = false;

            } else if (val_ == 'returnToMenu') {
                // возвращаемся в Главное меню
                isWholeLogoShown.value = true;
            };
        }
    );

    // смещаем логотип при переходе в главное меню
    function changeLogoPos() {
        if (gameState.isFirstGame == true && isLettersMovedToTop.value == true) {
            return 'logo_mooving';
        };
    };

    // определяем местоположение логотипа (относ. верхн. границы экрана)
    function setLogoPosition() {
        let myPos = gameState.isFirstGame == false ? 13.04 : 18.47;
        return {
            top: `${myPos}%`,
        };
    };

    // активируем анимацию мерцания ламп логотипа в зависимости от сценария
    function acivateNeonAnimation() {
        if (gameState.isFirstGame == true) {
            return 'neon_glow';
        };
    };

    // динамические стили темного фона на заднем плане
    function switchBackgroundStyle() {
        if (gameState.isFirstGame == true) {
            return 'fading_background';
        } else {
            return 'background_second_state';
        };
    };
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
            background: linear-gradient(
                to bottom,
                #000000 0%,      /* Черный цвет вверху */
                #000000 50%,     /* Черный цвет до середины */
                rgba(0, 0, 0, 0) 100%  /* Прозрачность внизу */
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
            position: absolute;
            bottom: 0%;
            width: 100%;
            height: 35%;
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