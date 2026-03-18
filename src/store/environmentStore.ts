// src/store/gameState.ts
import { defineStore } from "pinia";
// import { ref } from "vue";

export const useEnvironmentStore = defineStore("environmentStore", () => {
  const AXES_SIZE = 5;

  return {
    AXES_SIZE,
  };
});
