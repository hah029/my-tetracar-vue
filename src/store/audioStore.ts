// src/store/audioStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { SoundManager } from "@/game/sound/SoundManager";

export const useAudioStore = defineStore("audio", () => {
  const musicEnabled = ref(localStorage.getItem("musicEnabled") !== "0");
  const sfxEnabled = ref(localStorage.getItem("sfxEnabled") !== "0");

  const soundManager = SoundManager.getInstance();

  function toggleMusic() {
    musicEnabled.value = !musicEnabled.value;
    soundManager.setMusic(musicEnabled.value);

    localStorage.setItem("musicEnabled", musicEnabled.value ? "1" : "0");
  }

  function toggleSFX() {
    sfxEnabled.value = !sfxEnabled.value;
    soundManager.setSFX(sfxEnabled.value);

    localStorage.setItem("sfxEnabled", sfxEnabled.value ? "1" : "0");
  }

  return {
    musicEnabled,
    sfxEnabled,
    toggleMusic,
    toggleSFX,
  };
});
