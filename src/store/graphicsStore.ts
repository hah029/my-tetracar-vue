import { defineStore } from "pinia";
import { ref } from "vue";
import { Platform } from "@/sdk/Platform";
import type { shadowQualityTypes } from "@/configs/graphics";
import graphics from "@/configs/graphics";

export const useGraphicsStore = defineStore("graphics", () => {
  const vfxEnabled = ref(true); // общий рубильник эффектов
  const bloomEnabled = ref(false); // по умолчанию выключен
  const afterimageEnabled = ref(false); // по умолчанию выключен
  const fxaaEnabled = ref(true); // по умолчанию включен
  const nightMode = ref(true); // false = день, true = ночь
  const shadowEnabled = ref(false);
  const rgbShiftEnabled = ref(false);
  const shadowQuality = ref<shadowQualityTypes>("medium");
  const storage = Platform.getInstance();

  // загрузка сохранённых настроек
  async function loadFromStorage() {
    const data = await storage.getPlayerData();

    vfxEnabled.value = data?.vfxEnabled ?? true;
    bloomEnabled.value = data?.bloomEnabled ?? false;
    afterimageEnabled.value = data?.afterimageEnabled ?? false;
    fxaaEnabled.value = data?.fxaaEnabled ?? true;
    rgbShiftEnabled.value = data?.rgbShiftEnabled ?? false;
    nightMode.value = data?.nightMode ?? true;
    shadowEnabled.value = data?.shadowEnabled ?? false;
    shadowQuality.value = data?.shadowQuality ?? "low";
  }

  // переключение эффектов
  async function toggleVfx() {
    vfxEnabled.value = !vfxEnabled.value;
    await storage.setPlayerDataByKey("vfxEnabled", vfxEnabled.value);
  }
  async function toggleBloom() {
    bloomEnabled.value = !bloomEnabled.value;
    await storage.setPlayerDataByKey("bloomEnabled", bloomEnabled.value);
  }
  async function toggleAfterimage() {
    afterimageEnabled.value = !afterimageEnabled.value;
    await storage.setPlayerDataByKey(
      "afterimageEnabled",
      afterimageEnabled.value,
    );
  }
  async function toggleFxaa() {
    fxaaEnabled.value = !fxaaEnabled.value;
    await storage.setPlayerDataByKey("fxaaEnabled", fxaaEnabled.value);
  }
  async function toggleRGBShift() {
    rgbShiftEnabled.value = !rgbShiftEnabled.value;
    await storage.setPlayerDataByKey("rgbShiftEnabled", rgbShiftEnabled.value);
  }
  async function toggleNightMode() {
    nightMode.value = !nightMode.value;
    await storage.setPlayerDataByKey("nightMode", nightMode.value);
  }
  async function toggleShadow() {
    shadowEnabled.value = !shadowEnabled.value;
    await storage.setPlayerDataByKey("shadowEnabled", shadowEnabled.value);
  }
  async function setShadowQuality(quality: shadowQualityTypes) {
    shadowQuality.value = quality;
    await storage.setPlayerDataByKey("shadowQuality", shadowQuality.value);
  }

  function cycleShadowQuality() {
    if (shadowQuality.value === "low") setShadowQuality("medium");
    else if (shadowQuality.value === "medium") setShadowQuality("high");
    else setShadowQuality("low");
  }

  // меняем текущий pixel ratio
  function getPixelRatio(): number {
    return vfxEnabled.value
      ? Math.min(window.devicePixelRatio, graphics.pixel_ratio.enabled)
      : graphics.pixel_ratio.disabled;
  }

  function getBloomStrength(): number {
    return vfxEnabled.value
      ? graphics.bloom_strength.enabled
      : graphics.bloom_strength.disabled;
  }

  function getShadowQuality(): boolean {
    return vfxEnabled.value;
  }

  // Инициализация
  loadFromStorage().then();

  return {
    vfxEnabled,
    bloomEnabled,
    fxaaEnabled,
    nightMode,
    shadowEnabled,
    shadowQuality,
    rgbShiftEnabled,
    afterimageEnabled,
    toggleVfx,
    toggleBloom,
    toggleFxaa,
    toggleNightMode,
    toggleShadow,
    setShadowQuality,
    cycleShadowQuality,
    getPixelRatio,
    getBloomStrength,
    getShadowQuality,
    toggleRGBShift,
    toggleAfterimage,
  };
});
