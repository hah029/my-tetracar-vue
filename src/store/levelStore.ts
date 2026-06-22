import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  DEFAULT_LEVEL_ID,
  LEVELS,
  LEVEL_LIST,
  type LevelId,
} from "@/levels";
import {
  DEFAULT_DIFFICULTY_ID,
  DIFFICULTIES,
  DIFFICULTY_LIST,
  type DifficultyId,
} from "@/levels/difficulties";

export const useLevelStore = defineStore("levelStore", () => {
  const currentLevelId = ref<LevelId>(DEFAULT_LEVEL_ID);
  const currentDifficultyId = ref<DifficultyId>(DEFAULT_DIFFICULTY_ID);

  const levels = LEVEL_LIST;
  const difficulties = DIFFICULTY_LIST;

  const currentLevel = computed(() => LEVELS[currentLevelId.value]);
  const currentDifficulty = computed(
    () => DIFFICULTIES[currentDifficultyId.value],
  );
  const currentGameplay = computed(() => currentDifficulty.value.gameplay);

  function selectLevel(id: LevelId) {
    currentLevelId.value = id;
  }

  function selectDifficulty(id: DifficultyId) {
    currentDifficultyId.value = id;
  }

  function resetToDefault() {
    currentLevelId.value = DEFAULT_LEVEL_ID;
    currentDifficultyId.value = DEFAULT_DIFFICULTY_ID;
  }

  return {
    levels,
    difficulties,
    currentLevelId,
    currentDifficultyId,
    currentLevel,
    currentDifficulty,
    currentGameplay,
    selectLevel,
    selectDifficulty,
    resetToDefault,
  };
});
