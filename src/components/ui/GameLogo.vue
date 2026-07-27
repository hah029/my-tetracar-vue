<template>
    <Transition name="game_logo_whole_menu_showing">
        <div v-show="isWholeLogoShown" class="game_logo__root">
            <div class="background_animated" :class="backgroundClass"></div>
            <div class="gradient_bottom"></div>

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
    import { useDevice } from '@/composables/useDevice';
    import { GameStates } from "@/game/core/GameState";

    const gameState = useGameState();
    const isWholeLogoShown = ref(true);
    const isLettersShown = ref(false);
    const isLettersMovedToTop = ref(false);
    const isLinesShown = ref(false);
    const { deviceType } = useDevice();
    
    // #region - Логика состояний
    watch(
        () => [gameState.currentState, gameState.activeOverlay] as const,
        ([state, activeOverlay]) => {
            // console.log('gamelogo resumed');
            // console.log(gameState.currentState, state);
            // console.log(gameState.activeOverlay, activeOverlay);
            
            switch (state) {
                case GameStates.Preloader:
                    isWholeLogoShown.value = true;
                    setTimeout(() => {
                        isLettersShown.value = true;
                    }, 200);
                    setTimeout(() => {
                        isLinesShown.value = true;
                    }, 1000);
                    break;

                case GameStates.Menu:
                    isWholeLogoShown.value = true;
                    isLettersMovedToTop.value = true;
                    
                    // скрываем логотип игры при нужных сценариях
                    if ((deviceType.value==='mobile' || deviceType.value==='tablet') && gameState.activeOverlay !== null) {
                        isLettersShown.value = false;
                        isLinesShown.value = false;
                    } else {
                        isLettersShown.value = true;
                        isLinesShown.value = true;
                    };
                    break;

                // case GameStates.LevelSelect:
                //     isWholeLogoShown.value = false;
                //     break;

                case GameStates.Countdown:
                case GameStates.Play:
                    isWholeLogoShown.value = false;
                    break;

                case GameStates.Pause:
                case GameStates.Gameover:
                    isWholeLogoShown.value = false;
                    isLettersShown.value = false;
                    break;
            };
        },
        { immediate: true },
    );
    // #endregion

    // #region - Вычисляемые стили
    const logoMoveClass = computed(() => {
        return gameState.currentState === GameStates.Menu && isLettersMovedToTop.value
            ? "logo_mooving"
            : "";
    });

    const logoStyle = computed(() => {
        let topPreloader;
        let topMenu;
        let widthPreloader;
        let widthMenu;

        if (deviceType.value==='mobile') {
            // Mobile-first: базовые значения для мобильных
            topPreloader = 13.68;
            topMenu = 10.26;
            widthPreloader = 86.26;
            widthMenu = 78.44;
        // } else if (deviceType.value==='tablet') {
        //     // планшеты (позже переписать корректные значения)
        //     topPreloader = 15;
        //     topMenu = 10;
        //     widthPreloader = 83;
        //     widthMenu = 70;
        } else if (deviceType.value==='laptop') {
            // ноутбуки 
            topPreloader = 16.717;
            topMenu = 6.079;
            widthPreloader = 81.25;
            widthMenu = 65.556;
        } else if (deviceType.value==='desktop') {
            // десктоп
            topPreloader = 18.47;
            topMenu = 9.783;
            widthPreloader = 81.5;
            widthMenu = 65.625;
        };
        
        const myPos = gameState.isPreloaderShown ? topPreloader : topMenu;
        const myWidth = gameState.isPreloaderShown ? widthPreloader : widthMenu;
        
        return {
            top: `${myPos}vh`,
            width: `${myWidth}vw`
        };
    });

    const neonClass = computed(() => {
        return gameState.isPreloaderShown ? "neon_glow" : "";
    });

    const backgroundClass = computed(() => {
        return gameState.isPreloaderShown
            ? "fading_background"
            : "background_second_state";
    });
    // #endregion
</script>


<style lang='scss' scoped>
    @use "@/styles/menu.scss" as *;
    @use "@/styles/animations.scss";

    .game_logo__root {
        position: absolute;
        inset: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
        z-index: z("game_logo__root");
    }

    .background_animated {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 200%;
        background: linear-gradient(to bottom, #000000 0%, #000000 50%, rgba(204, 183, 183, 0) 100%);
        z-index: z("background");
    }

    .background_second_state {
        top: -200%;
    }

    .fading_background {
        top: 0%;
        animation: fading_keys 3s forwards;
        animation-delay: 4s;
    }

    .gradient_bottom {
        position: fixed;
        bottom: 0%;
        width: 100%;
        height: 55%;
        background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.8));
        z-index: z("gradient");
    }

    .logo_group {
        position: absolute;
        height: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: z("logo");
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
</style>