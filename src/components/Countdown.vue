<template>
    <div class="countdown_root">
        <TrainingScreen v-if="showTraining" />
        <Transition name="countdown_anim">
            <span v-if="!showTraining" class="countdown" :class="{ 'msgGo': count === 0 }" :key="count">
                {{ displayText }}
            </span>
        </Transition>
    </div>
</template>


<script setup lang="ts">
    import { ref, onMounted, computed, watch } from "vue";
    import { useGameState } from "@/store/gameState";
    import { SoundManager } from "@/game/sound/SoundManager";
    import { GameStates } from "@/game/core/GameState";
    import { createNewText } from '@/helpers/functions';
    import TrainingScreen from "@/components/TrainingScreen.vue";

    const gameStore = useGameState();
    const soundManager = SoundManager.getInstance();
    const count = ref(3);
    const foo = createNewText();
    const goMessage = computed(() => foo.makeText("gamePlay.goMessage"));
    const showTraining = ref(true);
    // const masterEnabled = ref(localStorage.getItem("masterEnabled") !== "0");

    const displayText = computed(() => {
        if (count.value === 0) {
            return goMessage.value;
        }
        return count.value.toString();
    });

    const playNext = () => {
        if (count.value === 0) {
            soundManager.playOneShot("sfx_start");
            setTimeout(() => {
                gameStore.setState(GameStates.Play);
            }, 650);
            return;
        };
        
        soundManager.playOneShot(`sfx_${count.value}`);
        
        setTimeout(() => {
            count.value--;
            playNext();
        }, 650);
    };

    watch(
        () => gameStore.activeOverlay,
        (newState) => {
            if (newState == null) {
                showTraining.value = false;
                // gameStore.isPreloaderShown = true;
                playNext();
            };
        },
    );

    onMounted(() => {
        gameStore.activeOverlay = 'trainingScreen';
        // localStorage.setItem('lang', code);
        // if (gameStore.isFirstGame == true) {
        //     showTraining.value = true;
        //     // gameStore.activeOverlay = 'trainingScreen';
        // } else {
        //     playNext();
        // };
    });
</script>


<style lang="scss" scoped>
    .countdown_root {
        position: relative;
        width: 100%;
        height: 100%;
    }
    
    .countdown {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 7.5rem;
        color: #FDFFE3;
        filter: drop-shadow(0 0 1rem rgba(255, 246, 25, 0.4));
        font-weight: bold;
        font-family: 'vla_shu';
        transition: all 0.1s ease-in-out;
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