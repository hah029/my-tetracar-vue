import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useMetaStore } from "@/store/metaStore";
import { useProgressStore } from "@/store/progressStore";
import { RewardProcessor } from "@/purchase/RewardProcessor";
import { FORTUNE_WHEEL_SECTORS, type FortuneWheelSector } from "@/configs/fortuneWheel";

export const useFortuneWheelStore = defineStore("fortuneWheelStore", () => {
  const isDevelopment = import.meta.env.DEV;
  const meta = useMetaStore();
  const progress = useProgressStore();
  const isSpinning = ref(false);
  const pendingSector = ref<FortuneWheelSector | null>(null);
  const wonSector = ref<FortuneWheelSector | null>(null);
  const error = ref<string | null>(null);
  const spins = computed(() => meta.fortuneSpins);
  const canSpin = computed(() => (isDevelopment || spins.value > 0) && !isSpinning.value);

  function pickSector(): FortuneWheelSector {
    const totalWeight = FORTUNE_WHEEL_SECTORS.reduce((sum, sector) => sum + sector.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const sector of FORTUNE_WHEEL_SECTORS) {
      roll -= sector.weight;
      if (roll <= 0) return sector;
    }
    return FORTUNE_WHEEL_SECTORS[0]!;
  }

  async function beginSpin(): Promise<FortuneWheelSector | null> {
    if (!canSpin.value) return null;
    const sector = pickSector();
    error.value = null;
    wonSector.value = null;
    const shouldConsumeSpin = spins.value > 0;
    if (shouldConsumeSpin && !meta.consumeFortuneSpin()) return null;
    try {
      if (shouldConsumeSpin) await meta.saveProgress();
      pendingSector.value = sector;
      isSpinning.value = true;
      return sector;
    } catch (err) {
      if (shouldConsumeSpin) meta.addFortuneSpins(1);
      error.value = "spin_failed";
      console.error("[FortuneWheelStore] could not save spin:", err);
      return null;
    }
  }

  async function completeSpin() {
    const sector = pendingSector.value;
    if (!sector) return false;
    try {
      await RewardProcessor.applyAll(sector.rewards);
      await progress.saveProgress();
      wonSector.value = sector;
      return true;
    } catch (err) {
      error.value = "reward_failed";
      console.error("[FortuneWheelStore] could not grant reward:", err);
      return false;
    } finally {
      pendingSector.value = null;
      isSpinning.value = false;
    }
  }

  function clearWonSector() {
    wonSector.value = null;
    error.value = null;
  }

  return { spins, isSpinning, wonSector, error, canSpin, beginSpin, completeSpin, clearWonSector };
});
