import { usePlayerStore } from "@/store/playerStore";
import { useMetaStore } from "@/store/metaStore";
import { defineStore } from "pinia";
import { ref } from "vue";
import { SoundManager } from "@/game/sound/SoundManager";
import { Platform } from "@/sdk/Platform";
import progressConfig from "@/configs/progress";
import { fill } from "three/src/extras/TextureUtils.js";
import { useObjectivesStore } from "@/store/objectivesStore";

export const useProgressStore = defineStore("progressStore", () => {
  const platform = Platform.getInstance();
  const playerStore = usePlayerStore();
  const metaStore = useMetaStore();
  const config = ref(progressConfig); // реактивный конфиг

  const currentDistance = ref(0);
  const score = ref(0);
  const highScore = ref(0);
  const currentMultiplier = ref(1);
  const isNewRecord = ref(false);
  const currentGoldens = ref(0);
  const currentEnergons = ref(0);

  let lastReportedCubes = 0;
  let soundManager: SoundManager;
  soundManager = SoundManager.getInstance();

  function calcScore(type_: string, amount_: number) {
    const cfg = config.value;
    const pointsMapper: Record<string, number> = {
      distance: cfg.multipliers.distance,
      golden: cfg.multipliers.golden,
      energon: cfg.multipliers.energon,
      jump: cfg.multipliers.jump,
      reduceShield: cfg.multipliers.obstacleCrushed,
      bulletHit: cfg.multipliers.obstacleCrushed,
    };

    const points = amount_ * pointsMapper[type_];
    currentMultiplier.value = getScoreMultiplier();
    score.value += points * currentMultiplier.value;

    if (highScore.value !== 0 && score.value > highScore.value) {
      if (!isNewRecord.value) {
        isNewRecord.value = true;
        playerStore.addNewMsg("newRecord");
        soundManager.playCue("newRecord");
      }
      highScore.value = score.value;
    }
  }

  function getScoreMultiplier() {
    const cfg = config.value;
    let mplr = cfg.scoreMultiplier.base;

    if (playerStore.isNitroEnabled) {
      mplr *= cfg.scoreMultiplier.growNitro;
    }

    if (metaStore.isFeatureActive("scoreMultiplier")) {
      mplr *= metaStore.getTimedEffect("scoreMultiplier")?.value || 1;
    }

    return mplr;
  }

  function resetScore() {
    score.value = 0;
  }

  async function restoreHighScore() {
    platform
      .getPlayerStats(["highScore"])
      .then((value) => {
        const savedHighScore = value?.highScore;
        if (savedHighScore) highScore.value = savedHighScore;
        resetNewRecord();
      })
      .catch((err) => console.error("Failed to restore high score:", err));
  }

  async function saveHighScore(): Promise<void> {
    if (isNewRecord.value || score.value > highScore.value) {
      highScore.value = score.value;
      await platform.setPlayerStatByKey("highScore", highScore.value);
      await platform.setLeaderboardScore("debugLeaderboard1", highScore.value);
    }
    isNewRecord.value = false;
  }

  function resetNewRecord() {
    isNewRecord.value = false;
  }

  function riseMultiplier(amount_: number, operation_: string) {
    if (operation_ === "multiply") {
      currentMultiplier.value *= amount_;
    } else if (operation_ === "add") {
      currentMultiplier.value += amount_;
    }
  }

  function reduceMultiplier(amount_: number) {
    currentMultiplier.value /= amount_;
  }

  function clearMultiplier() {
    currentMultiplier.value = 1;
  }

  function addGolden(amount: number) {
    metaStore.addGolden(amount);
    currentGoldens.value += amount;
    calcScore("golden", amount);
  }

  function addEnergon(amount: number) {
    metaStore.addEnergon(amount);
    currentEnergons.value += amount;
    calcScore("energon", amount);
  }

  function getDangerLevel() {
    return 0;
  }

  function resetDistance() {
    currentDistance.value = 0;
    lastReportedCubes = 0;
  }

  function resetCoins() {
    currentEnergons.value = 0;
    currentGoldens.value = 0;
  }

  function addDistance(value: number) {
    currentDistance.value += value;
    const currentCubes = getDistanceInCubes();
    const newCubes = currentCubes - lastReportedCubes;
    if (newCubes > 0) {
      calcScore("distance", newCubes);
      useObjectivesStore().track("distance_travelled", newCubes);
      lastReportedCubes = currentCubes;
    }
  }

  function getDistance(): number {
    return currentDistance.value;
  }

  function getDistanceInCubes(): number {
    return Math.floor(currentDistance.value);
  }

  async function saveArmorAndAmmo(): Promise<void> {
    try {
      await platform.setPlayerStats({
        armor: playerStore.armor,
        ammo: playerStore.ammo,
      });
    } catch (err) {
      console.error("Failed to save armor/ammo:", err);
    }
  }

  async function restoreArmorAndAmmo(): Promise<void> {
    try {
      const stats = await platform.getPlayerStats(["armor", "ammo"]);
      const savedArmor = stats?.armor;
      if (savedArmor != null) {
        const armorVal = Number(savedArmor);
        for (let i = 0; i < armorVal; i++) playerStore.addArmor();
      }
      const savedAmmo = stats?.ammo;
      if (savedAmmo != null) {
        const ammoVal = Number(savedAmmo);
        for (let i = 0; i < ammoVal; i++) playerStore.addAmmo();
      }
    } catch (err) {
      console.error("Failed to restore armor/ammo:", err);
    }
  }

  async function saveProgress(): Promise<void> {
    try {
      await metaStore.saveProgress();
    } catch (error) {
      console.error("Failed to save meta progress:", error);
    }
    try {
      await useObjectivesStore().persist();
    } catch (error) {
      console.error("Failed to save objectives progress:", error);
    }
    try {
      await saveHighScore();
    } catch (error) {
      console.error("Failed to save high score:", error);
    }
    try {
      await saveArmorAndAmmo();
    } catch (error) {
      console.error("Failed to save armor/ammo:", error);
    }
  }

  async function restoreProgress(): Promise<void> {
    restoreHighScore();
    await metaStore.restoreProgress();
    await restoreArmorAndAmmo();
  }

  function checkFullFilling(fillType: string): boolean {
    switch (fillType) {
      case "armor":
        return playerStore.armor >= metaStore.maxArmor;
      case "ammo":
        return playerStore.ammo >= metaStore.maxAmmo;
      default:
        return false;
    }
  }

  return {
    currentDistance,
    currentGoldens,
    currentEnergons,
    score,
    highScore,
    currentMultiplier,
    isNewRecord,

    calcScore,
    resetScore,
    resetCoins,
    saveHighScore,
    resetNewRecord,
    riseMultiplier,
    reduceMultiplier,
    clearMultiplier,

    addGolden,
    addEnergon,

    getDangerLevel,
    resetDistance,
    addDistance,
    getDistance,
    getDistanceInCubes,

    saveArmorAndAmmo,
    restoreArmorAndAmmo,
    restoreProgress,
    saveProgress,
    checkFullFilling,
  };
});
