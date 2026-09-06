import { Telemetry } from "@/telemetry/Telemetry";
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useMetaStore } from "@/store/metaStore";
import { useProgressStore } from "@/store/progressStore";
import { RewardProcessor } from "@/purchase/RewardProcessor";
import { FORTUNE_WHEEL_PRESETS, DEFAULT_FORTUNE_WHEEL_PRESET, isFortuneWheelPresetId, type FortuneWheelPresetId, type FortuneWheelSector } from "@/configs/fortuneWheel";

export const useFortuneWheelStore = defineStore("fortuneWheelStore", () => {
  const isDevelopment = import.meta.env.DEV;
  const meta = useMetaStore();
  const progress = useProgressStore();
  const isSpinning = ref(false);
  const pendingSector = ref<FortuneWheelSector | null>(null);
  const wonSector = ref<FortuneWheelSector | null>(null);
  const error = ref<string | null>(null);
  const selectedPresetId = ref<FortuneWheelPresetId>(DEFAULT_FORTUNE_WHEEL_PRESET);
  const presets = Object.values(FORTUNE_WHEEL_PRESETS);
  const selectedPreset = computed(() => FORTUNE_WHEEL_PRESETS[selectedPresetId.value]);
  const sectors = computed<FortuneWheelSector[]>(() => selectedPreset.value.sectors);
  const spins = computed(() => meta.getFortuneSpins(selectedPresetId.value));
  const totalSpins = computed(() => presets.reduce((sum, preset) => sum + meta.getFortuneSpins(preset.id), 0));

  function selectPreset(presetId: FortuneWheelPresetId) {
    if (isSpinning.value || !isFortuneWheelPresetId(presetId)) return false;
    selectedPresetId.value = presetId;
    clearWonSector();
    return true;
  }

  const canSpin = computed(() => (isDevelopment || spins.value > 0) && !isSpinning.value);

  function pickSector(): FortuneWheelSector {
    const totalWeight = sectors.value.reduce((sum, sector) => sum + sector.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const sector of sectors.value) {
      roll -= sector.weight;
      if (roll <= 0) return sector;
    }
    return sectors.value[0]!;
  }

  async function beginSpin(): Promise<FortuneWheelSector | null> {
    if (!canSpin.value) return null;
    const presetId = selectedPresetId.value;
    const sector = pickSector();
    error.value = null;
    wonSector.value = null;
    const shouldConsumeSpin = spins.value > 0;
    if (shouldConsumeSpin && !meta.consumeFortuneSpin(presetId)) return null;
    isSpinning.value = true;
    try {
      if (shouldConsumeSpin) await meta.saveProgress();
      pendingSector.value = sector;
      return sector;
    } catch (err) {
      if (shouldConsumeSpin) meta.addFortuneSpins(presetId, 1);
      isSpinning.value = false;
      error.value = "spin_failed";
      Telemetry.emit({ type: "reward.failed", source: "fortune_wheel", rewardId: presetId, reason: "spin_failed" });
      console.error("[FortuneWheelStore] could not save spin:", err);
      return null;
    }
  }

  async function completeSpin() {
    const sector = pendingSector.value;
    if (!sector) return false;
    pendingSector.value = null;
    try {
      const receipts = await RewardProcessor.applyAll(sector.rewards);
      await progress.saveProgress();
      wonSector.value = sector;
      Telemetry.emit({ type: "reward.claimed", source: "fortune_wheel", rewardId: sector.id,
        presetId: selectedPresetId.value, multiplier: 1, rewards: receipts });
      return true;
    } catch (err) {
      error.value = "reward_failed";
      Telemetry.emit({ type: "reward.failed", source: "fortune_wheel", rewardId: sector.id, reason: "reward_failed" });
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

  return { presets, selectedPresetId, selectedPreset, sectors, selectPreset, totalSpins, spins, isSpinning, wonSector, error, canSpin, beginSpin, completeSpin, clearWonSector };
});
