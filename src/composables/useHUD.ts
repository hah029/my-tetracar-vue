import { ref } from "vue";
import { useGameState } from "../store/gameState";

export function useHUD() {
  const gameState = useGameState();

  // Реактивные элементы HUD
  const scoreValue = ref(0);
  const bestValue = ref(0);
  const speedValue = ref(0);
  const nitroStatus = ref("INACTIVE");
  const nitroBar = ref(0); // процент
  const warningOpacity = ref(0);
  const warningColor = ref("rgb(255,255,255)");
  const laneDots = ref<boolean[]>([]);

  // --- Обновление HUD ---
  function updateHUD(speed: number, currentLane: number, dangerLevel: number) {
    // очки
    scoreValue.value = Math.floor(gameState.score);
    bestValue.value = Math.floor(gameState.highScore);

    // скорость
    speedValue.value = +(speed * 100).toFixed(1);

    // нитро
    if (gameState.isNitroEnabled) {
      nitroBar.value = 100;
      nitroStatus.value = "ACTIVE";
    } else {
      nitroBar.value = 0;
      nitroStatus.value = "INACTIVE";
    }

    // полосы движения - динамически обновляем размер массива
    const lanesCount = gameState.getLanesCount?.() ?? 4;
    laneDots.value = Array(lanesCount).fill(false).map((_, idx) => idx === currentLane);

    // предупреждение об опасности
    warningOpacity.value = Math.min(dangerLevel, 1);
    const intensity = Math.floor(255 * dangerLevel);
    warningColor.value = `rgb(255, ${255 - intensity}, ${255 - intensity})`;
  }

  // --- Пульсация нитро ---
  function pulseNitro() {
    if (!gameState.isNitroEnabled) return;
    nitroBar.value = 110;
    setTimeout(() => {
      nitroBar.value = 100;
    }, 100);
  }

  return {
    scoreValue,
    bestValue,
    speedValue,
    nitroStatus,
    nitroBar,
    warningOpacity,
    warningColor,
    laneDots,
    updateHUD,
    pulseNitro,
  };
}