<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useGameState } from "@/store/gameState";
import { SoundManager } from "@/game/sound/SoundManager";
import { GameStates } from "@/game/core/GameState";

const gameStore = useGameState();

const soundManager = SoundManager.getInstance();

const count = ref(3);

onMounted(() => {
    soundManager.fadeOut(undefined, 2.0);
    const interval = setInterval(() => {
        soundManager.play(`sfx_${count.value}`);
        count.value--;

        if (count.value === 0) {
            clearInterval(interval);
            soundManager.play("sfx_start");
            gameStore.setState(GameStates.Play);
        }
    }, 650);
});
</script>

<template>
    <div class="countdown">
        {{ count }}
    </div>
</template>

<style scoped>
.countdown {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 120px;
    color: #FDFFE3;
    filter: drop-shadow(0 0 15px rgba(255, 246, 25, 0.4));
    font-weight: bold;
    font-family: 'vla_shu';
    transition: all 0.1s ease-in-out;
}
</style>