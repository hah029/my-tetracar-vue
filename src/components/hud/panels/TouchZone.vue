<template>
    <div class="touch-controls" aria-label="Мобильное управление">
        <button class="touch-zone touch-zone--left" aria-label="Повернуть налево"
            @pointerdown.prevent="sendControl('left')" />
        <button class="touch-zone touch-zone--right" aria-label="Повернуть направо"
            @pointerdown.prevent="sendControl('right')" />
        <button class="fire-button" aria-label="Выстрел" @pointerdown.stop.prevent="sendControl('fire')">
            <img class="fire-button__icon" src="@/assets/images/hud/cube_bullet.svg" alt="" />
        </button>
    </div>
</template>

<script setup lang="ts">
import { inject } from "vue";

// Игровой экземпляр приходит через provide/inject
const game = inject<any>("game");

function sendControl(action: "left" | "right" | "fire") {
    game?.controls?.handleTouchControl?.(action);
}
</script>

<style scoped lang="scss">
.touch-controls {
    position: absolute;
    inset: 0;
    z-index: 11;
    pointer-events: none;
}

.touch-zone {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    border: 0;
    background: transparent;
    pointer-events: auto;
    touch-action: none;
}

.touch-zone--left {
    left: 0;
}

.touch-zone--right {
    right: 0;
}

.fire-button {
    position: absolute;
    right: clamp(3.6rem, 5vmin, 3.2rem);
    bottom: calc(clamp(-0.5rem, 0vmin, 8rem) + clamp(2.6rem, 4.5vmin, 3.2rem));
    width: clamp(4.4rem, 12.65vmin, 6.3rem);
    aspect-ratio: 1;
    border: 2px solid rgba(255, 102, 82, 0.9);
    border-radius: 50%;
    background: rgba(48, 8, 8, 0.62);
    box-shadow: inset 0 0 1rem rgba(255, 80, 55, 0.35), 0 0 1rem rgba(255, 80, 55, 0.35);
    display: grid;
    place-items: center;
    pointer-events: auto;
    touch-action: none;
    z-index: 999 !important;
}

.fire-button:active {
    transform: scale(0.93);
    background: rgba(116, 22, 16, 0.8);
}

.fire-button__icon {
    width: 52%;
    filter: drop-shadow(0 0 0.5rem rgba(255, 98, 70, 0.85));
}

@media (hover: hover) and (pointer: fine) {
    .touch-controls {
        display: none;
    }
}
</style>
