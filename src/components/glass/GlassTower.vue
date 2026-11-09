<template>
  <div class="glass_tower_root">
    <div class="glass_tower_frame" :style="frameStyle">
      <div class="glass_grid" :style="gridStyle">
        <div
          v-for="(row, rowIndex) in reversedGrid"
          :key="`row_${rowIndex}`"
          class="glass_row"
        >
          <div
            v-for="(cell, colIndex) in row"
            :key="`cell_${colIndex}`"
            :style="cellStyle(cell)"
          />
        </div>
      </div>

      <div
        v-for="cube in fallingCubes"
        :key="`fall_${cube.id}`"
        class="falling_cube"
        :style="fallingCubeStyle(cube)"
      />
    </div>

    <div v-if="glassStore.isOverflow" class="glass_overflow_label">OVERFLOW</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useGlassStore } from '@/store/glassStore';
import { CUBE_COLOR_HEX, type CubeColor } from '@/game/modes/glass/types';

const glassStore = useGlassStore();

const CELL_SIZE = 25;
const CELL_GAP = 0;
const FRAME_PADDING = 4;

function computeRows(): number {
  const towerHeight = Math.floor(window.innerHeight * 0.7);
  return Math.max(5, Math.floor(towerHeight / (CELL_SIZE + CELL_GAP)));
}

const reversedGrid = computed(() => {
  const rows = glassStore.rows;
  const cols = glassStore.columns;
  const result: (CubeColor | null)[][] = [];
  for (let r = rows - 1; r >= 0; r--) {
    const row: (CubeColor | null)[] = [];
    for (let c = 0; c < cols; c++) row.push(glassStore.grid[c][r]);
    result.push(row);
  }
  return result;
});

const frameStyle = computed(() => ({
  width: `${glassStore.columns * CELL_SIZE + FRAME_PADDING * 2}px`,
  height: `${glassStore.rows * CELL_SIZE + FRAME_PADDING * 2}px`,
}));

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${glassStore.columns}, ${CELL_SIZE}px)`,
  gridTemplateRows: `repeat(${glassStore.rows}, ${CELL_SIZE}px)`,
  gap: `${CELL_GAP}px`,
}));

function cellStyle(cell: CubeColor | null) {
  return {
    width: `${CELL_SIZE}px`,
    height: `${CELL_SIZE}px`,
    background: cell ? CUBE_COLOR_HEX[cell] : 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxSizing: 'border-box' as const,
  };
}

function fallingCubeStyle(cube: { color: CubeColor; currentRow: number }) {
  const rows = glassStore.rows;
  const rowFromTop = rows - 1 - cube.currentRow;
  return {
    position: 'absolute' as const,
    width: `${CELL_SIZE}px`,
    height: `${CELL_SIZE}px`,
    left: `${FRAME_PADDING}px`,
    top: `${FRAME_PADDING + rowFromTop * (CELL_SIZE + CELL_GAP)}px`,
    background: CUBE_COLOR_HEX[cube.color],
    boxShadow: `0 0 8px ${CUBE_COLOR_HEX[cube.color]}`,
    boxSizing: 'border-box' as const,
    pointerEvents: 'none' as const,
  };
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null;

function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => glassStore.setRows(computeRows()), 100);
}

onMounted(() => {
  glassStore.setRows(computeRows());
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  if (resizeTimer) clearTimeout(resizeTimer);
});
</script>

<style scoped lang="scss">
.glass_tower_root {
  position: fixed;
  top: 15vh;
  right: 24px;
  z-index: 200;
  pointer-events: none;
  user-select: none;
}

.glass_tower_frame {
  position: relative;
  padding: 4px;
  box-sizing: content-box;
  background: rgba(0, 0, 0, 0.42);
  border: 1px solid rgba(114, 179, 238, 0.55);
  border-radius: 6px;
  box-shadow: 0 0 12px rgba(114, 179, 238, 0.25);
}

.glass_grid {
  display: grid;
}

.glass_row {
  display: contents;
}

.glass_overflow_label {
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  color: #ff5555;
  font-family: 'vla_shu', sans-serif;
  font-size: 12px;
  letter-spacing: 1px;
  text-shadow: 0 0 6px #ff5555;
  white-space: nowrap;
}
</style>