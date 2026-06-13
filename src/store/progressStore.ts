// src/store/progressStore.ts
import { usePlayerStore } from "@/store/playerStore";
import { useMetaStore } from "@/store/metaStore";
import { defineStore } from "pinia";
import { ref } from "vue";
import { SoundManager } from "@/game/sound/SoundManager";
import { Platform } from "@/sdk/Platform";

export const useProgressStore = defineStore("progressStore", () => {
  const platform = Platform.getInstance();
  const playerStore = usePlayerStore();
  const metaStore = useMetaStore();
  const currentDistance = ref(0);
  const score = ref(0);
  const highScore = ref(0);
  const currentMultiplier = ref(1);
  const isNewRecord = ref(false);
  const currentGoldens = ref(0);
  const currentEnergons = ref(0);

  let lastReportedCubes = 0;

  // коэф-ты умножения очков при:
  const DISTANCE_MLT = 1; // прохождении одной единицы дистанции
  const GOLDEN_MLT = 5; // поимке Голдена
  const ENERGON_MLT = 50; // поимке Энергона
  const OBSTACLE_CRUSHED_MLT = 50; // разрушении препятствия (выстрелом или броней)
  const JUMP_MLT = 35; // прыжке на трамплине

  // коэф-ты роста множителя:
  const MULTI_BASE = 1; // базовый коэф-т
  const MULTI_GROW_NITRO = 2; // умножение при поимке нитро
  const MULTI_GROW_GOLDENS = 0.5; // суммирование при поимке N-го кол-ва голденов
  const MULTI_GROW_DISTANCE = 0.5; // суммирование при прохождении N-го кол-ва дистанции
  const MULTI_GROW_BOOSTER = 2; // суммирование при прохождении N-го кол-ва дистанции

  let soundManager: SoundManager;
  soundManager = SoundManager.getInstance();

  // #region - очки прогресса
  function calcScore(type_: string, amount_: number) {
    let points = 0;

    const pointsMapper = {
      distance: DISTANCE_MLT,
      golden: GOLDEN_MLT,
      energon: ENERGON_MLT,
      jump: JUMP_MLT,
      reduceShield: OBSTACLE_CRUSHED_MLT,
      bulletHit: OBSTACLE_CRUSHED_MLT,
    };

    points = amount_ * pointsMapper[type_];

    currentMultiplier.value = getScoreMultiplier();
    score.value += points * currentMultiplier.value;

    if (highScore.value != 0) {
      if (score.value > highScore.value) {
        if (!isNewRecord.value) {
          isNewRecord.value = true;
          playerStore.addNewMsg("newRecord");
          soundManager.play("sfx_new_record");
        }
        highScore.value = score.value;
      }
    }
  }

  function getScoreMultiplier() {
    let mplr = MULTI_BASE;

    if (playerStore.isNitroEnabled) mplr *= MULTI_GROW_NITRO;
    // if (playerStore.isNitroEnabled) mplr *= 2;

    // console.log(
    //   "[ProgressStore] metaStore.isFeatureActive('scoreMultiplier'):",
    //   metaStore.isFeatureActive("scoreMultiplier"),
    // );

    if (metaStore.isFeatureActive("scoreMultiplier")) {
      // console.log(
      //   "[ProgressStore] metaStore.getTimedEffect('scoreMultiplier')?.value:",
      //   metaStore.getTimedEffect("scoreMultiplier")?.value,
      // );
      mplr *= metaStore.getTimedEffect("scoreMultiplier")?.value || 1;
    }

    return mplr;
  }

  function resetScore() {
    score.value = 0;
  }

  async function restoreHighScore() {
    platform
      .getPlayerStatByKey("highScore")
      .then((value) => {
        if (value) highScore.value = value;
        resetNewRecord();
      })
      .catch((err) => console.error("Failed to restore high score:", err));
  }

  async function saveHighScore(): Promise<void> {
    // Сохраняем рекорд, если установлен флаг нового рекорда или текущий счёт превышает сохранённый
    if (isNewRecord.value || score.value > highScore.value) {
      // Обновляем локальный highScore на случай, если флаг не установлен, но счёт больше
      highScore.value = score.value;
      await platform.setPlayerStatByKey("highScore", highScore.value);
      await platform.setLeaderboardScore("debugLeaderboard1", highScore.value);
    }
    // Сбрасываем флаг после сохранения
    isNewRecord.value = false;
  }

  function resetNewRecord() {
    isNewRecord.value = false;
  }
  // #endregion

  // #region - работа с множителем
  // увеличиваем множитель
  function riseMultiplier(amount_: number, operation_: string) {
    if (operation_ == "multiply") {
      currentMultiplier.value *= amount_;
    } else if (operation_ == "add") {
      currentMultiplier.value += amount_;
    }
  }

  // понижаем множитель
  function reduceMultiplier(amount_: number) {
    currentMultiplier.value /= amount_;
  }

  // сбрасываем множитель до единицы
  function clearMultiplier() {
    currentMultiplier.value = 1;
  }
  // #endregion

  // #region - софт и хард валюта (делегировано в MetaStore)
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
  // #endregion

  // #region - дистанция
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
      calcScore("distance", newCubes); // добавляем очки только за НОВЫЕ целые кубы
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
      await platform.setPlayerStatByKey("armor", playerStore.armor);
      await platform.setPlayerStatByKey("ammo", playerStore.ammo);
    } catch (err) {
      console.error("Failed to save armor/ammo:", err);
    }
  }

  async function restoreArmorAndAmmo(): Promise<void> {
    try {
      const savedArmor = await platform.getPlayerStatByKey("armor");
      if (savedArmor != null) {
        const armorVal = Number(savedArmor);
        for (let i = 0; i < armorVal; i++) {
          playerStore.addArmor();
        }
      }

      const savedAmmo = await platform.getPlayerStatByKey("ammo");
      if (savedAmmo != null) {
        const ammoVal = Number(savedAmmo);
        for (let i = 0; i < ammoVal; i++) {
          playerStore.addAmmo();
        }
      }
    } catch (err) {
      console.error("Failed to restore armor/ammo:", err);
    }
  }

  async function saveProgress(): Promise<void> {
    try {
      await metaStore.saveProgress();
      await saveHighScore();
      await saveArmorAndAmmo();
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }

  function restoreProgress(): void {
    restoreHighScore();
    metaStore.restoreProgress();
    restoreArmorAndAmmo();
  }
  // #endregion

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
  };
});
