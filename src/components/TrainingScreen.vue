<template>
    <div class="training_screen">
        <div class="info_container">
            <div class="info_block">
                <span class="title">{{ title1 }}</span>
                <div class="text_block">
                    <span class="text color_blue">{{ text1_1 }}</span>
                    <span class="text color_blue">{{ text1_2 }}</span>
                </div>
            </div>
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
                            <img class='icon icon_abs energon_glow_core' src="@/assets/images/hud/cube_energon_core.svg" />
                            <img class='icon icon_abs energon_glow_grid' src="@/assets/images/hud/cube_energon_grid_frontal.svg" />
                        </div>
                        <span class="text color_blue_light">{{ text2_2 }}</span>
                    </div>
                </div>
            </div>
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
                </div>
            </div>
        </div>
        <div class="btn_container">
            <div class="menu_btn btn_correction" @click="gameStore.activeOverlay=null">{{ goMessage }}</div>
        </div>
    </div>
</template>


<script setup lang="ts">
    import { ref, onMounted, computed } from "vue";
    import { useGameState } from "@/store/gameState";
    import { SoundManager } from "@/game/sound/SoundManager";
    import { GameStates } from "@/game/core/GameState";
    import { createNewText } from '@/helpers/functions';
    
    // const gameStore = useGameState();
    // const soundManager = SoundManager.getInstance();
    // const count = ref(3);
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

    // const displayText = computed(() => {
    //     if (count.value === 0) {
    //         return goMessage.value;
    //     }
    //     return count.value.toString();
    // });

    // const playNext = () => {
    //     if (count.value === 0) {
    //         soundManager.playOneShot("sfx_start");
    //         setTimeout(() => {
    //             gameStore.setState(GameStates.Play);
    //         }, 650);
    //         return;
    //     };
        
    //     soundManager.playOneShot(`sfx_${count.value}`);
        
    //     setTimeout(() => {
    //         count.value--;
    //         playNext();
    //     }, 650);
    // };

    // onMounted(() => {
    //     playNext();
    // });
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
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.7) 50%, rgba(0, 0, 0, 1) 100%);
        font-family: 'jost-light';
        text-transform: uppercase;
        
    }

    .info_container {
        position: absolute;
        width: 100%;
        top: 18.75rem;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 16.875rem;
    }
    .info_block {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 2.125rem;
    }
    .title {
        font-size: 2.1875rem;
        color: #FDFFE3;
    }
    .text {
        font-size: 1.5625rem;
    }
    .text_block {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 0.625rem;
    }

    .composition_block {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 4.375rem;
    }
    .composition {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 1.25rem;
    }

    .image_container {
        width: 4.625rem;
        height: 4.625rem;
        position: relative;
    }
    .icon {
        width: 100%; 
    }
    .icon_abs {
        position: absolute;
        top: 0;
        left: 0;
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
        bottom: 10rem;
        display: flex;
        justify-content: center;
    }
    .btn_correction {
        font-size: 3.125rem;
    }






    .msgGo {
        font-size: 5.625rem;
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
</style>