import { ref } from "vue";
import { defineStore } from "pinia";

export const useAudioStore = defineStore("audio", () => {
  const musicEnabled = ref(true);
  const sfxEnabled = ref(true);

  function toggleMusic() {
    musicEnabled.value = !musicEnabled.value;
  }

  function toggleSFX() {
    sfxEnabled.value = !sfxEnabled.value;
  }

  return { musicEnabled, sfxEnabled, toggleMusic, toggleSFX };
});
