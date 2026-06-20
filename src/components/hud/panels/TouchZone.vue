<template>
    <div ref="touchZoneRef" class="touch-zone"></div>
</template>

<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref } from "vue";

// Игровой экземпляр приходит через provide/inject
const game = inject<any>("game");

const touchZoneRef = ref<HTMLElement | null>(null);

onMounted(() => {
    if (
        game &&
        game.controls &&
        typeof game.controls.registerTouchZone === "function"
    ) {
        game.controls.registerTouchZone(touchZoneRef.value);
    }
});

onUnmounted(() => {
    if (
        game &&
        game.controls &&
        typeof game.controls.cleanup === "function"
    ) {
        game.controls.cleanup();
    }
});
</script>

<style scoped lang="scss">
.touch-zone {
    position: absolute;
    inset: 0;

    z-index: 10;

    pointer-events: auto;
    touch-action: none;

    background: transparent;
}
</style>