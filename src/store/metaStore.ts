// src/store/metaStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { Platform } from "@/sdk/Platform";

import { DEFAULT_FORTUNE_WHEEL_PRESET, isFortuneWheelPresetId, type FortuneWheelPresetId } from "@/configs/fortuneWheel";

import meta, { getUpgradeMaxLevel, getUpgradeState } from "@/configs/meta";
import { useCommonStore } from "@/store/commonStore";

export interface TimedEffect {
  feature: string;
  value?: number;
  durationHours: number; // длительность в часах (для иерархии)
  expiresAt: number; // timestamp ms
}

export const useMetaStore = defineStore("metaStore", () => {
  const platform = Platform.getInstance();
  const commonStore = useCommonStore();

  // ===== STATE =====

  // Валюта
  const goldens = ref(0);
  const energons = ref(0);
  const fortuneSpins = ref<Partial<Record<FortuneWheelPresetId, number>>>({});

  // Скины
  const ownedSkins = ref<string[]>([]);
  const claimedRewardKeys = ref<string[]>([]);
  const activeSkin = ref<string | null>(null);

  // Апгрейды (уровни)
  const upgrades = ref<Record<string, number>>({
    ammoLevel: 0,
    armorLevel: 0,
    magnetLevel: 0,
    nitroDurationLevel: 0,
  });

  // Постоянные возможности
  const permanentFeatures = ref<string[]>([]);

  // Временные эффекты
  const activeTimedEffects = ref<TimedEffect[]>([]);

  // ===== COMPUTED (формулы из shop.md п.8) =====
  const ammoUpgrade = computed(() => getUpgradeState("ammoLevel", upgrades.value.ammoLevel)!);
  const armorUpgrade = computed(() => getUpgradeState("armorLevel", upgrades.value.armorLevel)!);
  const magnetUpgrade = computed(() => getUpgradeState("magnetLevel", upgrades.value.magnetLevel)!);
  const nitroUpgrade = computed(() => getUpgradeState("nitroDurationLevel", upgrades.value.nitroDurationLevel)!);
  const maxAmmo = computed(() => ammoUpgrade.value.count);
  const bulletSpeed = computed(() => ammoUpgrade.value.speed);
  const nitroDuration = computed(() => nitroUpgrade.value.durationMs);
  const maxArmor = computed(() => armorUpgrade.value.count);
  const shieldWaveRadius = computed(() => armorUpgrade.value.waveRadius);
  const magnetRadiusLaneStep = computed(() => commonStore.config.xzScaling * 6);
  const magnetRadius = computed(() =>
    magnetUpgrade.value.radius + magnetUpgrade.value.radiusLaneBonus * magnetRadiusLaneStep.value,
  );
  const magnetDuration = computed(() => magnetUpgrade.value.durationMs);
  const magnetMaxTargets = computed(() => magnetUpgrade.value.maxTargets);
  // Апгрейды (уровни)
  const maxUpgrades = ref<Record<string, any>>({
    ammoLevel: getUpgradeMaxLevel("ammoLevel"),
    armorLevel: getUpgradeMaxLevel("armorLevel"),
    magnetLevel: getUpgradeMaxLevel("magnetLevel"),
    nitroDurationLevel: getUpgradeMaxLevel("nitroDurationLevel"),
  });

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

  function getFortuneSpins(presetId: FortuneWheelPresetId): number {
    return fortuneSpins.value[presetId] ?? 0;
  }

  function addFortuneSpins(presetId: FortuneWheelPresetId, amount: number) {
    if (!isFortuneWheelPresetId(presetId)) throw new Error(`Unknown wheel preset: ${presetId}`);
    if (!Number.isFinite(amount) || amount <= 0) return;
    fortuneSpins.value[presetId] = getFortuneSpins(presetId) + Math.floor(amount);
  }

  function consumeFortuneSpin(presetId: FortuneWheelPresetId): boolean {
    if (!isFortuneWheelPresetId(presetId) || getFortuneSpins(presetId) < 1) return false;
    fortuneSpins.value[presetId] = getFortuneSpins(presetId) - 1;
    return true;
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

    const maxLevel = getUpgradeMaxLevel(key);
    if (maxLevel === undefined) {
      return;
    }

    if (upgrades.value[key] < maxLevel) {
      upgrades.value[key] = Math.min(upgrades.value[key] + amount, maxLevel);
    }
  }

  function getMaxUpgradeLevel(key: string): number | undefined {
    return getUpgradeMaxLevel(key);
  }

  function getUpgradeParameters(key: string, level = getUpgradeLevel(key)) {
    return getUpgradeState(key, level);
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
    await platform.setPlayerStats({
      goldens: goldens.value,
      energons: energons.value,
    });

    await platform.setPlayerData({
      ownedSkins: JSON.stringify(ownedSkins.value),
      claimedRewardKeys: JSON.stringify(claimedRewardKeys.value),
      activeSkin: activeSkin.value ?? "",
      upgrades: JSON.stringify(upgrades.value),
      permanentFeatures: JSON.stringify(permanentFeatures.value),
      activeTimedEffects: JSON.stringify(activeTimedEffects.value),
      fortuneSpins: JSON.stringify(fortuneSpins.value),
    });
  }

  async function restoreProgress(): Promise<void> {
    try {
      const stats = await platform.getPlayerStats(["goldens", "energons"]);
      const g = stats?.goldens;
      if (g != null) goldens.value = Number(g);

      const e = stats?.energons;
      if (e != null) energons.value = Number(e);

      const data = await platform.getPlayerData();
      if (data?.claimedRewardKeys != null) {
        try {
          const keys = JSON.parse(String(data.claimedRewardKeys));
          if (Array.isArray(keys)) claimedRewardKeys.value = keys.filter((key) => typeof key === "string");
        } catch { /* Keep defaults for malformed saved keys. */ }
      }
      const skins = data?.ownedSkins;
      if (skins != null) {
        try {
          const parsed = JSON.parse(String(skins));
          if (Array.isArray(parsed)) ownedSkins.value = parsed;
        } catch {
          // keep defaults
        }
      }

      const aSkin = data?.activeSkin;
      if (aSkin != null && String(aSkin) !== "") {
        activeSkin.value = String(aSkin);
      }

      const upg = data?.upgrades;
      if (upg != null) {
        try {
          const parsed = JSON.parse(String(upg));
          if (
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
          ) {
            const legacyMagnetLevel = Math.max(
              Number(parsed.magnetRadiusLevel) || 0,
              Number(parsed.magnetDurationLevel) || 0,
              Number(parsed.magnetCapacityLevel) || 0,
            );
            upgrades.value = { ...upgrades.value, ...parsed, magnetLevel: Math.max(parsed.magnetLevel ?? 0, legacyMagnetLevel) };
          }
        } catch {
          // keep defaults
        }
      }

      const perm = data?.permanentFeatures;
      if (perm != null) {
        try {
          const parsed = JSON.parse(String(perm));
          if (Array.isArray(parsed)) permanentFeatures.value = parsed;
        } catch {
          // keep defaults
        }
      }

      const timed = data?.activeTimedEffects;
      if (timed != null) {
        try {
          const parsed = JSON.parse(String(timed));
          if (Array.isArray(parsed)) activeTimedEffects.value = parsed;
        } catch {
          // keep defaults
        }
      }

      const spins = data?.fortuneSpins;
      if (spins != null) {
        try {
          const parsed = typeof spins === "string" ? JSON.parse(spins) : spins;
          const balances = typeof parsed === "number"
            ? { [DEFAULT_FORTUNE_WHEEL_PRESET]: parsed }
            : parsed;
          if (balances && typeof balances === "object" && !Array.isArray(balances)) {
            fortuneSpins.value = Object.fromEntries(
              Object.entries(balances).filter(([id, amount]) =>
                isFortuneWheelPresetId(id) && typeof amount === "number" && Number.isFinite(amount),
              ).map(([id, amount]) => [id, Math.max(0, Math.floor(amount as number))]),
            );
          }
        } catch {
          // Keep defaults if saved balances are malformed.
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
    fortuneSpins,
    ownedSkins,
    claimedRewardKeys,
    activeSkin,
    upgrades,
    permanentFeatures,
    activeTimedEffects,

    // computed
    maxAmmo,
    bulletSpeed,
    nitroDuration,
    maxArmor,
    shieldWaveRadius,
    magnetRadiusLaneStep,
    magnetRadius,
    magnetDuration,
    magnetMaxTargets,
    maxUpgrades,

    // валюта
    addGolden,
    addEnergon,
    spendGolden,
    spendEnergon,
    getBalance,
    getFortuneSpins,
    addFortuneSpins,
    consumeFortuneSpin,

    // скины
    unlockSkin,
    setActiveSkin,
    isSkinOwned,

    // апгрейды
    setUpgradeLevel,
    getUpgradeLevel,
    getMaxUpgradeLevel,
    getUpgradeParameters,
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
