import { defineStore } from "pinia";
import { ref } from "vue";
import { Platform } from "@/sdk/Platform";

export const useGraphicsStore = defineStore("graphics", () => {
  const vfxEnabled = ref(true); // общий рубильник эффектов
  const bloomEnabled = ref(false); // по умолчанию выключен
  const afterimageEnabled = ref(false); // по умолчанию выключен
  const fxaaEnabled = ref(true); // по умолчанию включен
  const nightMode = ref(false); // false = день, true = ночь
  const shadowEnabled = ref(true);
  const rgbShiftEnabled = ref(true);
  const shadowQuality = ref<"low" | "medium" | "high">("medium");
  const storage = Platform.getInstance();

  // загрузка сохранённых настроек
  async function loadFromStorage() {
    await storage
      .getPlayerDataByKey("vfxEnabled")
      .then((v: boolean) => (vfxEnabled.value = v ?? false));
    await storage
      .getPlayerDataByKey("bloomEnabled")
      .then((v: boolean) => (bloomEnabled.value = v ?? false));
    await storage
      .getPlayerDataByKey("afterimageEnabled")
      .then((v: boolean) => (afterimageEnabled.value = v ?? false));
    await storage
      .getPlayerDataByKey("fxaaEnabled")
      .then((v: boolean) => (fxaaEnabled.value = v ?? false));
    await storage
      .getPlayerDataByKey("rgbShiftEnabled")
      .then((v: boolean) => (rgbShiftEnabled.value = v ?? false));
    await storage
      .getPlayerDataByKey("nightMode")
      .then((v: boolean) => (nightMode.value = v ?? false));
    await storage
      .getPlayerDataByKey("shadowEnabled")
      .then((v: boolean) => (shadowEnabled.value = v ?? false));
    await storage
      .getPlayerDataByKey("shadowQuality")
      .then(
        (v: "low" | "medium" | "high") => (shadowQuality.value = v ?? "low"),
      );
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
  async function setShadowQuality(quality: "low" | "medium" | "high") {
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
    return vfxEnabled.value ? Math.min(window.devicePixelRatio, 1.0) : 0.8;
  }

  function getBloomStrength(): number {
    return vfxEnabled.value ? 0.3 : 0.0;
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
