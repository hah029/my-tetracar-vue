// src/store/metaStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { Platform } from "@/sdk/Platform";

import meta from "@/configs/meta";

export interface TimedEffect {
  feature: string;
  value?: number;
  durationHours: number; // длительность в часах (для иерархии)
  expiresAt: number; // timestamp ms
}

export const useMetaStore = defineStore("metaStore", () => {
  const platform = Platform.getInstance();

  // ===== STATE =====

  // Валюта
  const goldens = ref(1e6);
  const energons = ref(1e6);

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
  const maxAmmo = computed(
    () => meta.base_counts.ammo + upgrades.value.ammoLevel * 2,
  );
  const maxArmor = computed(
    () => meta.base_counts.shield + upgrades.value.armorLevel,
  );
  const magnetRadius = computed(
    () => meta.base_counts.magnetRadius + upgrades.value.magnetRadiusLevel * 5,
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
    if (upgrades.value[key] < meta.max_upgrades[key]) {
      upgrades.value[key] += amount;
    }
  }

  // ===== ПОСТОЯННЫЕ ФИЧИ =====

  function addPermanentFeature(feature: string) {
    if (!permanentFeatures.value.includes(feature)) {
      permanentFeatures.value.push(feature);
    }
    // При покупке permanent-версии — удаляем все timed-эффекты этой же фичи
    activeTimedEffects.value = activeTimedEffects.value.filter(
      (e) => e.feature !== feature,
    );
  }

  function hasPermanentFeature(feature: string): boolean {
    return permanentFeatures.value.includes(feature);
  }

  // ===== ВРЕМЕННЫЕ ЭФФЕКТЫ =====

  function addTimedEffect(effect: TimedEffect) {
    // Если есть permanent-версия этой фичи — не добавляем timed (она не нужна)
    if (permanentFeatures.value.includes(effect.feature)) {
      return;
    }
    // Если уже есть timed-эффект с той же или большей длительностью — не добавляем
    const existing = activeTimedEffects.value.find(
      (e) =>
        e.feature === effect.feature && e.durationHours >= effect.durationHours,
    );
    if (existing) {
      return;
    }
    // Удаляем все эффекты той же фичи с меньшей длительностью (они теперь не нужны)
    activeTimedEffects.value = activeTimedEffects.value.filter(
      (e) =>
        e.feature !== effect.feature || e.durationHours >= effect.durationHours,
    );
    activeTimedEffects.value.push(effect);
  }

  function getActiveTimedEffects(): TimedEffect[] {
    const now = Date.now();
    if (!Array.isArray(activeTimedEffects.value)) return [];
    return activeTimedEffects.value.filter((e) => e.expiresAt > now);
  }

  function isTimedFeatureActive(feature: string): boolean {
    const now = Date.now();
    if (!Array.isArray(activeTimedEffects.value)) return false;
    return activeTimedEffects.value.some(
      (e) => e.feature === feature && e.expiresAt > now,
    );
  }

  function isFeatureActive(feature: string): boolean {
    return hasPermanentFeature(feature) || isTimedFeatureActive(feature);
  }

  function cleanupExpiredEffects() {
    const now = Date.now();
    if (Array.isArray(activeTimedEffects.value)) {
      activeTimedEffects.value = activeTimedEffects.value.filter(
        (e) => e.expiresAt > now,
      );
    } else {
      activeTimedEffects.value = [];
    }
  }

  function getTimedEffect(feature: string): TimedEffect | null {
    return getActiveTimedEffects().find((e) => e.feature === feature) || null;
  }

  // ===== СОХРАНЕНИЕ / ЗАГРУЗКА =====

  async function saveProgress(): Promise<void> {
    // Каждый вызов обёрнут в отдельный try/catch, чтобы ошибка в одном
    // не прерывала сохранение остальных данных.
    // const saveStat = async (key: string, value: number) => {
    //   try {
    //     await platform.setPlayerStats({ [key]: value });
    //   } catch (err) {
    //     console.error(
    //       `[MetaStore] saveProgress: ошибка setPlayerStatByKey("${key}"):`,
    //       err,
    //     );
    //   }
    // };
    // const saveData = async (key: string, value: any) => {
    //   try {
    //     await platform.setPlayerDataByKey(key, value);
    //   } catch (err) {
    //     console.error(
    //       `[MetaStore] saveProgress: ошибка setPlayerDataByKey("${key}"):`,
    //       err,
    //     );
    //   }
    // };

    // Числовые значения — через stats API (setStats принимает только числа)
    // await saveStat("goldens", goldens.value);
    // await saveStat("energons", energons.value);

    await platform.setPlayerStats({
      goldens: goldens.value,
      energons: energons.value,
    });

    // JSON-значения — через data API
    // await saveData("ownedSkins", JSON.stringify(ownedSkins.value));
    // await saveData("activeSkin", activeSkin.value ?? "");
    // await saveData("upgrades", JSON.stringify(upgrades.value));
    // await saveData(
    //   "permanentFeatures",
    //   JSON.stringify(permanentFeatures.value),
    // );
    // await saveData(
    //   "activeTimedEffects",
    //   JSON.stringify(activeTimedEffects.value),
    // );
  }

  async function restoreProgress(): Promise<void> {
    try {
      // Числовые значения — через stats API
      const g = await platform.getPlayerStatByKey("goldens");
      if (g != null) goldens.value = Number(g);

      const e = await platform.getPlayerStatByKey("energons");
      if (e != null) energons.value = Number(e);

      // JSON-значения — через data API
      const skins = await platform.getPlayerDataByKey("ownedSkins");
      if (skins != null) {
        try {
          const parsed = JSON.parse(String(skins));
          if (Array.isArray(parsed)) ownedSkins.value = parsed;
        } catch {
          // keep defaults
        }
      }

      const aSkin = await platform.getPlayerDataByKey("activeSkin");
      if (aSkin != null && String(aSkin) !== "") {
        activeSkin.value = String(aSkin);
      }

      const upg = await platform.getPlayerDataByKey("upgrades");
      if (upg != null) {
        try {
          const parsed = JSON.parse(String(upg));
          if (
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
          ) {
            upgrades.value = { ...upgrades.value, ...parsed };
          }
        } catch {
          // keep defaults
        }
      }

      const perm = await platform.getPlayerDataByKey("permanentFeatures");
      if (perm != null) {
        try {
          const parsed = JSON.parse(String(perm));
          if (Array.isArray(parsed)) permanentFeatures.value = parsed;
        } catch {
          // keep defaults
        }
      }

      const timed = await platform.getPlayerDataByKey("activeTimedEffects");
      if (timed != null) {
        try {
          const parsed = JSON.parse(String(timed));
          if (Array.isArray(parsed)) activeTimedEffects.value = parsed;
        } catch {
          // keep defaults
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
    getTimedEffect,

    // сохранение
    saveProgress,
    restoreProgress,
  };
});
