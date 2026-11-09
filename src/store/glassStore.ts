import { defineStore } from 'pinia';
import { ref } from 'vue';

import type {
  CubeColor,
  FallingCube,
  FlyingToScoreCube,
} from '@/game/modes/glass/types';
import { useMetaStore } from '@/store/metaStore';
import { useProgressStore } from '@/store/progressStore';
import { SoundManager } from '@/game/sound/SoundManager';

let nextId = 0;

const FLIGHT_DURATION_MS = 600;   // полёт спрайта до очков
const FALL_DURATION_MS = 280;     // падение внутри стакана
const REWARD_PER_CUBE = 10;       // голденов за 1 сожжённый кубик
const SCORE_PER_CUBE = 50;        // доп. очков за 1 сожжённый кубик

export const useGlassStore = defineStore('glass', () => {
  const isActive = ref(false);

  const columns = ref(1);
  const rows = ref(24);

  // grid[col][row] — цвет или null; row = 0 — нижний ряд.
  const grid = ref<(CubeColor | null)[][]>(
    Array.from({ length: columns.value }, () => Array(rows.value).fill(null)),
  );

  const flyingToScore = ref<FlyingToScoreCube[]>([]);
  const fallingCubes = ref<FallingCube[]>([]);
  const pendingQueue = ref<CubeColor[]>([]);

  const isOverflow = ref(false);

  function activate() {
    isActive.value = true;
    reset();
  }

  function deactivate() {
    isActive.value = false;
    reset();
  }

  function reset() {
    grid.value = Array.from({ length: columns.value }, () =>
      Array(rows.value).fill(null),
    );
    flyingToScore.value = [];
    fallingCubes.value = [];
    pendingQueue.value = [];
    isOverflow.value = false;
    nextId = 0;
  }

  /** Пересчитываем строки под 70vh стакан с ячейкой 25px. */
  function setRows(nextRows: number) {
    const clamped = Math.max(5, Math.floor(nextRows));
    if (clamped === rows.value) return;

    const prev = rows.value;
    rows.value = clamped;

    const newGrid = Array.from({ length: columns.value }, () =>
      Array(rows.value).fill(null),
    );
    for (let c = 0; c < columns.value; c++) {
      for (let r = 0; r < Math.min(prev, rows.value); r++) {
        newGrid[c][r] = grid.value[c]?.[r] ?? null;
      }
    }
    grid.value = newGrid;
  }

  /**
   * Игрок поймал бустер — запускаем спрайт от машины к очкам.
   * Через FLIGHT_DURATION_MS спрайт исчезает и попадает в очередь.
   */
  function queuePickup(
    color: CubeColor,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ) {
    if (!isActive.value || isOverflow.value) return;

    const cube: FlyingToScoreCube = {
      id: nextId++,
      color,
      startX,
      startY,
      endX,
      endY,
    };
    flyingToScore.value.push(cube);

    window.setTimeout(() => {
      removeFlying(cube.id);
      pendingQueue.value.push(color);
      processPending();
    }, FLIGHT_DURATION_MS);
  }

  function removeFlying(id: number) {
    const idx = flyingToScore.value.findIndex((c) => c.id === id);
    if (idx !== -1) flyingToScore.value.splice(idx, 1);
  }

  function processPending() {
    if (!isActive.value || isOverflow.value) return;
    if (fallingCubes.value.length > 0) return; // ждём, пока текущий долетит
    const next = pendingQueue.value.shift();
    if (next === undefined) return;

    // Свободная ячейка снизу.
    const col = 0;
    let targetRow = -1;
    for (let r = 0; r < rows.value; r++) {
      if (grid.value[col][r] === null) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) {
      isOverflow.value = true;
      return;
    }

    const cube: FallingCube = {
      id: nextId++,
      color: next,
      startRow: rows.value,   // над видимой сеткой — «появляется сверху стакана»
      targetRow,
      currentRow: rows.value,
    };
    fallingCubes.value.push(cube);
    animateFall(cube);
  }

  function animateFall(cube: FallingCube) {
    const startTime = performance.now();

    function step(now: number) {
      const t = Math.min(1, (now - startTime) / FALL_DURATION_MS);
      const eased = t * t;
      cube.currentRow = cube.startRow + (cube.targetRow - cube.startRow) * eased;

      if (t < 1) {
        requestAnimationFrame(step);
        return;
      }

      cube.currentRow = cube.targetRow;
      const idx = fallingCubes.value.findIndex((c) => c.id === cube.id);
      if (idx !== -1) fallingCubes.value.splice(idx, 1);

      grid.value[0][cube.targetRow] = cube.color;
      checkMatches(0, cube.targetRow);

      // Даём checkMatches завершить сдвиг, затем — следующий из очереди.
      window.setTimeout(() => processPending(), FALL_DURATION_MS + 30);
    }

    requestAnimationFrame(step);
  }

  /**
   * Проверяем run в колонке. Если >= 3 подряд — сжигаем, верх сдвигаем вниз
   * разом (без анимации падения), начисляем награду.
   */
  function checkMatches(col: number, row: number): void {
    const color = grid.value[col][row];
    if (!color) return;

    let start = row;
    let end = row;
    while (start - 1 >= 0 && grid.value[col][start - 1] === color) start--;
    while (end + 1 < rows.value && grid.value[col][end + 1] === color) end++;

    const count = end - start + 1;
    if (count < 3) return;

    // 1. Удаляем сгоревшие.
    for (let r = start; r <= end; r++) {
      grid.value[col][r] = null;
    }

    // 2. Верхние падают вниз разом.
    let writeRow = start;
    for (let r = end + 1; r < rows.value; r++) {
      const c = grid.value[col][r];
      if (!c) continue;
      grid.value[col][writeRow] = c;
      grid.value[col][r] = null;
      writeRow++;
    }

    // 3. Награда: +10 голденов и +50 очков за кубик.
    const metaStore = useMetaStore();
    const progressStore = useProgressStore();

    const goldens = count * REWARD_PER_CUBE;
    metaStore.addGolden(goldens);
    progressStore.currentGoldens += goldens;
    progressStore.calcScore('glassMatch', count * SCORE_PER_CUBE);

    SoundManager.getInstance().playCue('goldenPickup');

    // 4. Возможная цепочка — кубики, только что «свалившиеся» вниз.
    window.setTimeout(() => {
      for (let r = 0; r < rows.value; r++) {
        const c = grid.value[col][r];
        if (!c) continue;
        if (r - 1 >= 0 && grid.value[col][r - 1] === c) continue;
        checkMatches(col, r);
      }
    }, 20);
  }

  return {
    isActive,
    columns,
    rows,
    grid,
    flyingToScore,
    fallingCubes,
    pendingQueue,
    isOverflow,
    activate,
    deactivate,
    setRows,
    queuePickup,
    reset,
  };
});