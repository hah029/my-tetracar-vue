// src/store/progressStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export const useProgressStore = defineStore("progressStore", () => {
  const currentDistance = ref(0);
  const score = ref(0);
  const highScore = ref(0);
  const diamondScore = ref(0);

  function addScore(amount: number) {
    score.value += amount;
    if (score.value > highScore.value) highScore.value = score.value;
  }

  function addDiamondScore(amount: number) {
    diamondScore.value += amount;
  }

  function resetScore() {
    score.value = 0;
  }

  function getDangerLevel() {
    return 0;
  }

  function resetDistance() {
    currentDistance.value = 0;
  }

  function addDistance(value: number) {
    currentDistance.value += value;
  }

  function getDistance(): number {
    return currentDistance.value;
  }

  function getDistanceInCubes(): number {
    return Math.floor(currentDistance.value);
  }
  function saveHighScore(): void {
    if (score.value > highScore.value) highScore.value = score.value;
  }

  return {
    score,
    highScore,

    addScore,
    resetScore,
    getDangerLevel,
    addDistance,
    resetDistance,
    getDistance,
    getDistanceInCubes,
    saveHighScore,
    addDiamondScore,
  };
});
