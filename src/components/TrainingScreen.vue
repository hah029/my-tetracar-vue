<template>
    <div class="training_screen">
        <div class="info_container">

            <!-- Блок "Набирай" -->
            <div class="info_block">
                <span class="title">{{ title1 }}</span>
                <div class="highscore_table">
                    <div class="highscore_image_container">
                        <img class='icon' src="@/assets/images/hud/highscore_table.svg" />
                    </div>
                    <div class="text_block">
                        <span class="color_yellow_super_light">{{ text1_1 }}</span>
                        <span class="color_yellow_super_light">{{ text1_2 }}</span>
                    </div>
                </div>
            </div>

            <!-- Блок "Собирай" -->
            <div class="info_block">
                <span class="title">{{ title2 }}</span>
                <div class="composition_block">
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_golden.svg" />
                        </div>
                        <span class="color_yellow_light">{{ text2_1 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container energon_glow_general">
                            <img class='icon icon_abs' src="@/assets/images/hud/cube_energon_grid_backward.svg" />
                            <img class='icon icon_abs energon_glow_core'
                                src="@/assets/images/hud/cube_energon_core.svg" />
                            <img class='icon icon_abs energon_glow_grid'
                                src="@/assets/images/hud/cube_energon_grid_frontal.svg" />
                        </div>
                        <span class="color_blue_light">{{ text2_2 }}</span>
                    </div>
                </div>
            </div>

            <!-- Блок "Используй" -->
            <div class="info_block">
                <span class="title">{{ title3 }}</span>
                <div class="composition_block">
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_bullet.svg" />
                        </div>
                        <span class="color_red_light">{{ text3_1 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_armor.svg" />
                        </div>
                        <span class="color_white">{{ text3_2 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_nitro.svg" />
                        </div>
                        <span class="color_green_light">{{ text3_3 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_magnet.svg" />
                        </div>
                        <span class="color_ultramarine">{{ text3_4 }}</span>
                    </div>
                </div>
            </div>

        </div>
        <div class="btn_container">
            <div class="menu_btn btn_correction" @click="goMessageAction">{{ goMessage }}</div>
        </div>
    </div>
</template>


<script setup lang="ts">
    import { computed } from "vue";
    import { useGameState } from "@/store/gameState";
    import { Platform } from "@/sdk/Platform";
    import { createNewText } from '@/helpers/functions';

    const foo = createNewText();
    const goMessage = computed(() => foo.makeText("trainingScreen.startButton"));
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
        await Platform.getInstance().setPlayerDataByKey("isFirstEnter", false);
        gameStore.setFirstGameIndicator(false);
        gameStore.activeOverlay = null;
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
        padding-top: 330px;
        padding-bottom: 170px;
        box-sizing: border-box;

        background: linear-gradient(to bottom,
                rgba(0, 0, 0, 0.7) 0%,
                rgba(0, 0, 0, 0.7) 50%,
                rgba(0, 0, 0, 1) 100%);
    }

    .info_container {
        width: 100%;
        padding: 0 210px;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        @include text-info-size-m;
        text-transform: uppercase;
        color: $color-yellow-super-light;
        letter-spacing: normal;
    }
    // #endregion
    
    // #region - info_block
    .info_block {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
    }

    .title {
        font-size: clamp(1.3rem, 2vw, 2.1875rem);
        color: #fdffe3;
        text-align: center;
    }

    .composition_block {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        flex-wrap: wrap;
    }

    .composition {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;

        gap: clamp(0.5rem, 1vw, 1.25rem);
    }

    .highscore_table {
        display: flex;
        align-items: center;
        justify-content: flex-start;

        gap: clamp(0.5rem, 1vw, 1.25rem);
    }

    .text_block {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: 0.3125rem;
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
        width: clamp(4rem, 8vw, 8.5rem);
        height: auto;
    }

    .image_container {
        width: 66px;
        height: 66px;
        position: relative;
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