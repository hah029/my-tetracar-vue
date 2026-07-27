<template>
    <!-- Первая страница с подсказкой (набирай, собирай, используй) -->
    <div v-if="pageNumber==1" class="training_screen first_step">
        <div class="info_container">

            <!-- Блок "Набирай" -->
            <div class="info_block">
                <span class="title_text">{{ title1 }}</span>
                <div class="highscore_table">
                    <div class="highscore_image_container">
                        <img class='icon' src="@/assets/images/hud/highscore_table.svg" />
                    </div>
                    <div class="text_block">
                        <span class="description_text color_yellow_super_light">{{ text1_1 }}</span>
                        <span class="description_text color_yellow_super_light">{{ text1_2 }}</span>
                    </div>
                </div>
            </div>

            <!-- Блок "Собирай" -->
            <div class="info_block">
                <span class="title_text">{{ title2 }}</span>
                <div class="composition_block">
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_golden.svg" />
                        </div>
                        <span class="description_text text_corr_1 color_yellow_light">{{ text2_1 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container energon_glow_general">
                            <img class='icon icon_abs' src="@/assets/images/hud/cube_energon_grid_backward.svg" />
                            <img class='icon icon_abs energon_glow_core'
                                src="@/assets/images/hud/cube_energon_core.svg" />
                            <img class='icon icon_abs energon_glow_grid'
                                src="@/assets/images/hud/cube_energon_grid_frontal.svg" />
                        </div>
                        <span class="description_text text_corr_1 color_blue_light">{{ text2_2 }}</span>
                    </div>
                </div>
            </div>

            <!-- Блок "Используй" -->
            <div class="info_block">
                <span class="title_text">{{ title3 }}</span>
                <div class="composition_block">
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_bullet.svg" />
                        </div>
                        <span class="description_text text_corr_2 color_red_light">{{ text3_1 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_armor.svg" />
                        </div>
                        <span class="description_text text_corr_2 color_white">{{ text3_2 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_nitro.svg" />
                        </div>
                        <span class="description_text text_corr_2 color_green_light">{{ text3_3 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_magnet.svg" />
                        </div>
                        <span class="description_text text_corr_2 color_ultramarine">{{ text3_4 }}</span>
                    </div>
                </div>
            </div>

        </div>
        <div class="btn_container">
            <div class="menu_btn btn_correction" @click="goMessageAction">{{ goMessage }}</div>
        </div>
    </div>

    <!-- Вторая страница с подсказкой (управляй) -->
    <div v-else class="training_screen second_step">
        <div class="header_block">
            <div class="header_text">{{ titleMessage }}</div>
            <div class="header_image">
                <img class="image" src="@/assets/images/title_line_image.svg" />
            </div>
        </div>
        <ControlSettings :backStatus="false" :isOnTrainingScreen="true"/>
        <div class="btn_container">
            <div class="menu_btn btn_correction" @click="goMessageAction">{{ goMessage }}</div>
        </div>
    </div>
</template>


<script setup lang="ts">
    import { computed, ref } from "vue";
    import { useGameState } from "@/store/gameState";
    import { Platform } from "@/sdk/Platform";
    import { createNewText } from '@/helpers/functions';
    import ControlSettings from '@/components/settings/overlays/ControlSettings.vue'

    const pageNumber = ref(1);

    const foo = createNewText();
    const titleMessage = computed(() => foo.makeText("trainingScreen.control.title", 'empty'));
    const goMessage = computed(() => {
        if (pageNumber.value == 1) {
            return foo.makeText("trainingScreen.nextButton");
        } else {
            return foo.makeText("trainingScreen.startButton");
        };
    });
    const gameStore = useGameState();

    const title1 = computed(() => foo.makeText("trainingScreen.earn.title", 'empty'));
    const title2 = computed(() => foo.makeText("trainingScreen.collect.title", 'empty'));
    const title3 = computed(() => foo.makeText("trainingScreen.use.title", 'empty'));

    const text1_1 = computed(() => foo.getElementFromArray('trainingScreen.earn.text', 0));
    const text1_2 = computed(() => foo.getElementFromArray('trainingScreen.earn.text', 1));

    const text2_1 = computed(() => foo.getElementFromArray('trainingScreen.collect.text', 0));
    const text2_2 = computed(() => foo.getElementFromArray('trainingScreen.collect.text', 1));

    const text3_1 = computed(() => foo.getElementFromArray('trainingScreen.use.text', 0));
    const text3_2 = computed(() => foo.getElementFromArray('trainingScreen.use.text', 1));
    const text3_3 = computed(() => foo.getElementFromArray('trainingScreen.use.text', 2));
    const text3_4 = computed(() => foo.getElementFromArray('trainingScreen.use.text', 3));

    async function goMessageAction() {
        if (pageNumber.value == 1) {
            pageNumber.value = 2;
        } else {
            await Platform.getInstance().setPlayerDataByKey("isFirstEnter", false);
            gameStore.setFirstGameIndicator(false);
            gameStore.activeOverlay = null;
        };
    };
</script>


<style lang="scss" scoped>
    @use "@/styles/menu.scss";
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;

    // #region - general
    .training_screen {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
        background: linear-gradient(to bottom,
                rgba(0, 0, 0, 0.7) 0%,
                rgba(0, 0, 0, 0.7) 50%,
                rgba(0, 0, 0, 1) 100%);
    }

    .info_container {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 0 8.034vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            padding: 0 8.034vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     padding: 0 8.034vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            padding: 0 8.333vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            padding: 0 10.938vw;
        }
    }

    .first_step {
        padding-top: 36.752vh;
        padding-bottom: 10.256vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            padding-top: 36.752vh;
            padding-bottom: 10.256vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     padding-top: 36.752vh;
        //     padding-bottom: 10.256vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            padding-top: 16.5vw;
            padding-bottom: 6.25vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            padding-top: 17.708vw;
            padding-bottom: 8.854vw;
        }
    }

    .second_step {
        padding-top: 7.265vh;
        padding-bottom: 10.256vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            padding-top: 7.265vh;
            padding-bottom: 10.256vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     padding-top: 36.752vh;
        //     padding-bottom: 10.256vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            padding-top: 10vw;
            padding-bottom: 6.25vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            padding-top: 11.458vw;
            padding-bottom: 8.854vw;
        }
    }
    // #endregion
    
    // #region - info_block
    .info_block {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 4.615vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            gap: 4.615vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     gap: 4.615vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            gap: 1.806vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            gap: 1.771vw;
        }
    }

    .composition_block {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 0vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            gap: 0vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     gap: 0vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            gap: 0.417vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            gap: 1.042vw;
        }
    }

    .composition {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 3.248vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            gap: 3.248vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     gap: 3.248vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            gap: 1.667vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            gap: 1.25vw;
        }
    }

    .highscore_table {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 1.709vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            gap: 1.709vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     gap: 1.709vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            gap: 1.111vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            gap: 1.042vw;
        }
    }

    .text_block {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: 1.5vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            gap: 1.5vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     gap: 2.564vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            gap: 0.5vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            gap: 0.521vw;
        }
    }

    // #endregion
    
    // #region - text
    .title_text {
        @include text-info-size-l;
        color: $color-yellow-super-light;
        text-transform: uppercase;
        line-height: 1;
    }

    .description_text {
        @include text-info-size-m;
        text-transform: uppercase;
        text-align: center;
        line-height: 1;
    }

    .text_corr_1 {
        letter-spacing: 0;
        width: 23.077vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            width: 23.077vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     width: 23.077vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            width: 7.778vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            width: 6.458vw;
        }
    }

    .text_corr_2 {
        letter-spacing: 0;
        width: 19.658vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            width: 19.658vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     width: 19.658vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            width: 6.944vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            width: 5.938vw;
        }
    }
    // #endregion

    // #region - button
    .btn_container {
        display: flex;
        justify-content: center;
    }

    .btn_correction {
        @include text-button-size-l;
        color: $color-yellow-super-light;
    }
    // #endregion

    // #region - images and icons
    .highscore_image_container {
        height: auto;
        width: 18.29vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            width: 18.29vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     width: 18.29vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            width: 7.639vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            width: 7.083vw;
        }
    }

    .image_container {
        position: relative;
        width: 8.889vh;
        height: 8.889vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            width: 8.889vh;
            height: 8.889vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     width: 8.889vh;
        //     height: 8.889vh;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            width: 3.333vw;
            height: 3.333vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            width: 3.438vw;
            height: 3.438vw;
        }
    }

    .icon {
        width: 100%;
        height: auto;
    }

    .icon_abs {
        position: absolute;
        inset: 0;
    }

    .energon_glow_general {
        filter: drop-shadow(0 0 0.44rem rgb(43, 157, 229));
    }

    .energon_glow_grid {
        filter: drop-shadow(0 0 1.25rem rgb(20, 212, 255));
    }

    .energon_glow_core {
        filter: drop-shadow(0 0 0.625rem rgb(20, 212, 255));
    }
    // #endregion
</style>