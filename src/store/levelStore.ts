import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  DEFAULT_LEVEL_ID,
  LEVELS,
  LEVEL_LIST,
  type LevelId,
} from "@/levels";
import type { MusicConfig } from "@/levels/types";
import {
  DEFAULT_DIFFICULTY_ID,
  DIFFICULTIES,
  DIFFICULTY_LIST,
  type DifficultyId,
} from "@/levels/difficulties";
import { createSpawnRules } from "@/levels/spawnRules";

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
  const currentEnvironment = computed(() => currentLevel.value.environment);
  const currentInteractive = computed(() => currentLevel.value.interactive);
  const currentMusic = computed<MusicConfig>(() => currentLevel.value.music);
  const currentSpawnRules = computed(() =>
    createSpawnRules(currentInteractive.value, currentDifficulty.value),
  );

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

  function getCurrentSpawnRules() {
    return createSpawnRules(currentInteractive.value, currentDifficulty.value);
  }

  return {
    levels,
    difficulties,
    currentLevelId,
    currentDifficultyId,
    currentLevel,
    currentDifficulty,
    currentGameplay,
    currentEnvironment,
    currentInteractive,
    currentMusic,
    currentSpawnRules,
    getCurrentSpawnRules,
    selectLevel,
    selectDifficulty,
    resetToDefault,
  };
});
