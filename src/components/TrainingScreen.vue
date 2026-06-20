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
                        <span class="text color_yellow_super_light">{{ text1_1 }}</span>
                        <span class="text color_yellow_super_light">{{ text1_2 }}</span>
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
                        <span class="text color_yellow_light">{{ text2_1 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container energon_glow_general">
                            <img class='icon icon_abs' src="@/assets/images/hud/cube_energon_grid_backward.svg" />
                            <img class='icon icon_abs energon_glow_core'
                                src="@/assets/images/hud/cube_energon_core.svg" />
                            <img class='icon icon_abs energon_glow_grid'
                                src="@/assets/images/hud/cube_energon_grid_frontal.svg" />
                        </div>
                        <span class="text color_blue_light">{{ text2_2 }}</span>
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
                        <span class="text color_red_light">{{ text3_1 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_armor.svg" />
                        </div>
                        <span class="text color_white">{{ text3_2 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_nitro.svg" />
                        </div>
                        <span class="text color_green_light">{{ text3_3 }}</span>
                    </div>
                    <div class="composition">
                        <div class="image_container">
                            <img class='icon' src="@/assets/images/hud/cube_magnet.svg" />
                        </div>
                        <span class="text color_ultramarine">{{ text3_4 }}</span>
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


.training_screen {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to bottom,
            rgba(0, 0, 0, 0.7) 0%,
            rgba(0, 0, 0, 0.7) 50%,
            rgba(0, 0, 0, 1) 100%);
    font-family: "jost-light";
    text-transform: uppercase;
    overflow-y: auto;
    padding: 2rem;
}

.info_container {
    position: absolute;
    width: 100%;
    top: clamp(4rem, 12vh, 18.75rem);

    display: flex;
    justify-content: center;
    align-items: flex-start;
    flex-wrap: wrap;

    gap: clamp(2rem, 5vw, 11.4375rem);

    padding-inline: 2rem;
}

.info_block {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;

    gap: clamp(1rem, 2vw, 2.125rem);

    min-width: 14rem;
    max-width: 24rem;
}

.title {
    font-size: clamp(1.3rem, 2vw, 2.1875rem);
    color: #fdffe3;
    text-align: center;
}

.text {
    font-size: clamp(0.9rem, 1.5vw, 1.5625rem);
    text-align: center;
}

.highscore_table {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    gap: clamp(0.5rem, 1vw, 1.25rem);
}

.highscore_image_container {
    width: clamp(4rem, 8vw, 8.5rem);
    height: auto;
}

.text_block {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 0.3125rem;
}

.composition_block {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    flex-wrap: wrap;

    gap: clamp(1rem, 2vw, 3.75rem);
}

.composition {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;

    gap: clamp(0.5rem, 1vw, 1.25rem);
}

.image_container {
    width: clamp(3rem, 6vw, 4.625rem);
    height: clamp(3rem, 6vw, 4.625rem);
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

.btn_container {
    position: absolute;
    width: 100%;
    bottom: clamp(2rem, 5vh, 10rem);

    display: flex;
    justify-content: center;

    padding-inline: 1rem;
}

.btn_correction {
    font-size: clamp(1.25rem, 3vw, 3.125rem);
}

.msgGo {
    font-size: clamp(2rem, 6vw, 5.625rem);
}

.countdown_anim-enter-active {
    transition: all 0.25s ease-out;
    transition-delay: 0.1s;
}

.countdown_anim-leave-active {
    transition: all 0.2s ease-out;
}

.countdown_anim-enter-from {
    opacity: 0;
    transform: scale(0.7);
}

.countdown_anim-leave-to {
    opacity: 0;
    transform: scale(2);
}

/* планшеты */

@media (max-width: 1024px) {
    .info_container {
        gap: 3rem;
    }
}

/* телефоны */

@media (max-width: 768px) {
    .training_screen {
        justify-content: flex-start;
        padding-top: 2rem;
    }

    .info_container {
        position: relative;
        top: 0;

        flex-direction: column;
        align-items: center;

        padding-bottom: 8rem;
    }

    .info_block {
        width: 100%;
        max-width: 28rem;
    }

    .highscore_table {
        flex-direction: column;
    }

    .text_block {
        align-items: center;
    }

    .composition_block {
        width: 100%;
    }

    .btn_container {
        position: fixed;
        bottom: 1.5rem;
        left: 0;
    }
}
</style>