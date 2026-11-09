<template>
  <div class="glass_fly_layer">
    <div
      v-for="cube in glassStore.flyingToScore"
      :key="cube.id"
      class="glass_fly_cube"
      :style="cubeStyle(cube)"
    />
  </div>
</template>

<script setup lang="ts">
import { useGlassStore } from '@/store/glassStore';
import { CUBE_COLOR_HEX, type FlyingToScoreCube } from '@/game/modes/glass/types';

const glassStore = useGlassStore();

function cubeStyle(cube: FlyingToScoreCube) {
  return {
    '--start-x': `${cube.startX}px`,
    '--start-y': `${cube.startY}px`,
    '--end-x': `${cube.endX}px`,
    '--end-y': `${cube.endY}px`,
    backgroundColor: CUBE_COLOR_HEX[cube.color],
  };
}
</script>

<style scoped lang="scss">
.glass_fly_layer {
  position: fixed;
  inset: 0;
  z-index: 9990;
  pointer-events: none;
  overflow: hidden;
}

.glass_fly_cube {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  box-shadow: 0 0 10px currentColor;
  animation: glass_fly_to_score 600ms cubic-bezier(0.33, 1, 0.68, 1) forwards;
  will-change: transform, opacity;
}

@keyframes glass_fly_to_score {
  0% {
    transform: translate(var(--start-x), var(--start-y)) scale(1);
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--end-x), var(--end-y)) scale(0.5);
    opacity: 0;
  }
}
</style>