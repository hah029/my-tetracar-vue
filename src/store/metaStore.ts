// src/store/metaStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { Platform } from "@/sdk/Platform";

export interface TimedEffect {
  feature: string;
  value?: number;
  expiresAt: number; // timestamp ms
}

export const useMetaStore = defineStore("metaStore", () => {
  const platform = Platform.getInstance();

  // ===== STATE =====

  // Валюта
  const goldens = ref(1e10);
  const energons = ref(1e10);

  // Скины
  const ownedSkins = ref<string[]>([]);
  const activeSkin = ref<string | null>(null);

  // Апгрейды (уровни)
  const upgrades = ref<Record<string, number>>({
    ammoLevel: 0,
    armorLevel: 0,
    magnetRadiusLevel: 0,
  });

  // Постоянные возможности
  const permanentFeatures = ref<string[]>([]);

  // Временные эффекты
  const activeTimedEffects = ref<TimedEffect[]>([]);

  // ===== COMPUTED (формулы из shop.md п.8) =====
  const BASE_AMMO = 10;
  const BASE_ARMOR = 1;
  const BASE_MAGNET_RADIUS = 20;

  const maxAmmo = computed(() => BASE_AMMO + upgrades.value.ammoLevel * 2);
  const maxArmor = computed(() => BASE_ARMOR + upgrades.value.armorLevel);
  const magnetRadius = computed(
    () => BASE_MAGNET_RADIUS + upgrades.value.magnetRadiusLevel * 5,
  );

  // ===== ВАЛЮТА =====

  function addGolden(amount: number) {
    goldens.value += amount;
  }

  function addEnergon(amount: number) {
    energons.value += amount;
  }

  function spendGolden(amount: number): boolean {
    if (goldens.value < amount) return false;
    goldens.value -= amount;
    return true;
  }

  function spendEnergon(amount: number): boolean {
    if (energons.value < amount) return false;
    energons.value -= amount;
    return true;
  }

  function getBalance(currency: "golden" | "energon"): number {
    return currency === "golden" ? goldens.value : energons.value;
  }

  // ===== СКИНЫ =====

  function unlockSkin(skinId: string) {
    if (!ownedSkins.value.includes(skinId)) {
      ownedSkins.value.push(skinId);
    }
  }

  function setActiveSkin(skinId: string | null) {
    if (skinId === null || ownedSkins.value.includes(skinId)) {
      activeSkin.value = skinId;
    }
  }

  function isSkinOwned(skinId: string): boolean {
    return ownedSkins.value.includes(skinId);
  }

  // ===== АПГРЕЙДЫ =====

  function setUpgradeLevel(key: string, level: number) {
    upgrades.value[key] = level;
  }

  function getUpgradeLevel(key: string): number {
    return upgrades.value[key] ?? 0;
  }

  function increaseUpgrade(key: string, amount: number = 1) {
    if (!(key in upgrades.value)) {
      upgrades.value[key] = 0;
    }
    upgrades.value[key] += amount;
  }

  // ===== ПОСТОЯННЫЕ ФИЧИ =====

  function addPermanentFeature(feature: string) {
    if (!permanentFeatures.value.includes(feature)) {
      permanentFeatures.value.push(feature);
    }
  }

  function hasPermanentFeature(feature: string): boolean {
    return permanentFeatures.value.includes(feature);
  }

  // ===== ВРЕМЕННЫЕ ЭФФЕКТЫ =====

  function addTimedEffect(effect: TimedEffect) {
    activeTimedEffects.value.push(effect);
  }

  function getActiveTimedEffects(): TimedEffect[] {
    const now = Date.now();
    return activeTimedEffects.value.filter((e) => e.expiresAt > now);
  }

  function isTimedFeatureActive(feature: string): boolean {
    const now = Date.now();
    return activeTimedEffects.value.some(
      (e) => e.feature === feature && e.expiresAt > now,
    );
  }

  function isFeatureActive(feature: string): boolean {
    return hasPermanentFeature(feature) || isTimedFeatureActive(feature);
  }

  function cleanupExpiredEffects() {
    const now = Date.now();
    activeTimedEffects.value = activeTimedEffects.value.filter(
      (e) => e.expiresAt > now,
    );
  }

  // ===== СОХРАНЕНИЕ / ЗАГРУЗКА =====

  async function saveProgress(): Promise<void> {
    try {
      await platform.setPlayerStatByKey("goldens", goldens.value);
      await platform.setPlayerStatByKey("energons", energons.value);
      await platform.setPlayerStatByKey(
        "ownedSkins",
        JSON.stringify(ownedSkins.value),
      );
      await platform.setPlayerStatByKey("activeSkin", activeSkin.value ?? "");
      await platform.setPlayerStatByKey(
        "upgrades",
        JSON.stringify(upgrades.value),
      );
      await platform.setPlayerStatByKey(
        "permanentFeatures",
        JSON.stringify(permanentFeatures.value),
      );
      await platform.setPlayerStatByKey(
        "activeTimedEffects",
        JSON.stringify(activeTimedEffects.value),
      );
    } catch (err) {
      console.error("[MetaStore] saveProgress error:", err);
    }
  }

  async function restoreProgress(): Promise<void> {
    try {
      const g = await platform.getPlayerStatByKey("goldens");
      if (g != null) goldens.value = Number(g);

      const e = await platform.getPlayerStatByKey("energons");
      if (e != null) energons.value = Number(e);

      const skins = await platform.getPlayerStatByKey("ownedSkins");
      if (skins != null) {
        try {
          ownedSkins.value = JSON.parse(String(skins));
        } catch {
          ownedSkins.value = [];
        }
      }

      const aSkin = await platform.getPlayerStatByKey("activeSkin");
      if (aSkin != null && String(aSkin) !== "") {
        activeSkin.value = String(aSkin);
      }

      const upg = await platform.getPlayerStatByKey("upgrades");
      if (upg != null) {
        try {
          upgrades.value = { ...upgrades.value, ...JSON.parse(String(upg)) };
        } catch {
          // keep defaults
        }
      }

      const perm = await platform.getPlayerStatByKey("permanentFeatures");
      if (perm != null) {
        try {
          permanentFeatures.value = JSON.parse(String(perm));
        } catch {
          permanentFeatures.value = [];
        }
      }

      const timed = await platform.getPlayerStatByKey("activeTimedEffects");
      if (timed != null) {
        try {
          activeTimedEffects.value = JSON.parse(String(timed));
        } catch {
          activeTimedEffects.value = [];
        }
      }

      // Очищаем истёкшие эффекты после загрузки
      cleanupExpiredEffects();
    } catch (err) {
      console.error("[MetaStore] restoreProgress error:", err);
    }
  }

  return {
    // state
    goldens,
    energons,
    ownedSkins,
    activeSkin,
    upgrades,
    permanentFeatures,
    activeTimedEffects,

    // computed
    maxAmmo,
    maxArmor,
    magnetRadius,

    // валюта
    addGolden,
    addEnergon,
    spendGolden,
    spendEnergon,
    getBalance,

    // скины
    unlockSkin,
    setActiveSkin,
    isSkinOwned,

    // апгрейды
    setUpgradeLevel,
    getUpgradeLevel,
    increaseUpgrade,

    // постоянные фичи
    addPermanentFeature,
    hasPermanentFeature,

    // временные эффекты
    addTimedEffect,
    getActiveTimedEffects,
    isTimedFeatureActive,
    isFeatureActive,
    cleanupExpiredEffects,

    // сохранение
    saveProgress,
    restoreProgress,
  };
});
