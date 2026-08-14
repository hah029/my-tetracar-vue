<template>
    <div class="touch-controls" aria-label="Мобильное управление">
        <button class="touch-zone touch-zone--left" aria-label="Повернуть налево"
            @pointerdown.prevent="sendControl('left')" />
        <button class="touch-zone touch-zone--right" aria-label="Повернуть направо"
            @pointerdown.prevent="sendControl('right')" />
        <button class="touch-zone touch-zone--vertical" aria-label="Прыжок или быстрое приземление"
            @pointerdown.prevent="startVerticalGesture" @pointermove.prevent
            @pointerup.prevent="finishVerticalGesture" @pointercancel="cancelVerticalGesture" />
    </div>
</template>

<script setup lang="ts">
import { inject } from "vue";

// Игровой экземпляр приходит через provide/inject
const game = inject<any>("game");

const MIN_VERTICAL_SWIPE_DISTANCE = 36;

let gesturePointerId: number | null = null;
let gestureStartY = 0;

function sendControl(action: "left" | "right" | "up" | "down") {
    game?.controls?.handleTouchControl?.(action);
}

function startVerticalGesture(event: PointerEvent) {
    gesturePointerId = event.pointerId;
    gestureStartY = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
}

function finishVerticalGesture(event: PointerEvent) {
    if (event.pointerId !== gesturePointerId) return;

    const offsetY = event.clientY - gestureStartY;
    gesturePointerId = null;

    if (Math.abs(offsetY) < MIN_VERTICAL_SWIPE_DISTANCE) return;

    sendControl(offsetY < 0 ? "up" : "down");
}

function cancelVerticalGesture() {
    gesturePointerId = null;
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
    width: 36%;
}

.touch-zone--right {
    right: 0;
    width: 36%;
}

.touch-zone--vertical {
    left: 36%;
    width: 28%;
}

@media (hover: hover) and (pointer: fine) {
    .touch-controls {
        display: none;
    }
}
</style>
