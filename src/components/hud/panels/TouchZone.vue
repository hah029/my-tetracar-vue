<template>
    <div class="touch-controls" aria-label="Мобильное управление">
        <button class="touch-zone touch-zone--left" aria-label="Повернуть налево"
            @pointerdown.prevent="sendControl('left')" />
        <button class="touch-zone touch-zone--right" aria-label="Повернуть направо"
            @pointerdown.prevent="sendControl('right')" />
    </div>
</template>

<script setup lang="ts">
import { inject } from "vue";

// Игровой экземпляр приходит через provide/inject
const game = inject<any>("game");

function sendControl(action: "left" | "right") {
    game?.controls?.handleTouchControl?.(action);
}
</script>

<style scoped lang="scss">
.touch-controls {
    position: absolute;
    inset: 0;
    z-index: 9;
    pointer-events: none;
}

.touch-zone {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    border: 0;
    background: transparent;
    appearance: none;
    -webkit-appearance: none;
    outline: none;
    box-shadow: none;
    pointer-events: auto;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
}

.touch-zone:active,
.touch-zone:focus {
    background: transparent;
    outline: none;
    box-shadow: none;
}

.touch-zone--left {
    left: 0;
}

.touch-zone--right {
    right: 0;
}

@media (hover: hover) and (pointer: fine) {
    .touch-controls {
        display: none;
    }
}
</style>
