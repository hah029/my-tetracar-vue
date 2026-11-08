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

  const levels = computed(() => LEVEL_LIST.filter((level) => level.to_show));
  const difficulties = DIFFICULTY_LIST;

  const availableDifficulties = computed(() => {
    const difficultyIds = currentLevel.value.difficultyIds;

    if (!difficultyIds) return DIFFICULTY_LIST;

    return DIFFICULTY_LIST.filter((difficulty) =>
      difficultyIds.includes(difficulty.id),
    );
  });

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
    if (!LEVELS[id].enabled) return;

    currentLevelId.value = id;

    if (
      !availableDifficulties.value.some(
        (difficulty) => difficulty.id === currentDifficultyId.value,
      )
    ) {
      const [firstDifficulty] = availableDifficulties.value;
      if (firstDifficulty) currentDifficultyId.value = firstDifficulty.id;
    }
  }

  function selectDifficulty(id: DifficultyId) {
    if (!availableDifficulties.value.some((difficulty) => difficulty.id === id)) {
      return;
    }

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
    availableDifficulties,
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
