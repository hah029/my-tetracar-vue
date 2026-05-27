// src/store/audioStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { SoundManager } from "@/game/sound/SoundManager";
import { Platform } from "@/sdk/Platform";

export const useAudioStore = defineStore("audio", () => {
  const storage = Platform.getInstance();
  const DEFAULT_VOLUME = 0.3;

  const masterEnabled = ref(false);
  const musicEnabled = ref(false);
  const sfxEnabled = ref(false);
  const masterVolume = ref(DEFAULT_VOLUME);

  const soundManager = SoundManager.getInstance();

  async function toggleMusic() {
    musicEnabled.value = !musicEnabled.value;
    soundManager.setMusic(musicEnabled.value);
    await storage.setPlayerDataByKey("musicEnabled", musicEnabled.value);
  }

  async function toggleMaster() {
    masterEnabled.value = !masterEnabled.value;
    soundManager.setMusic(masterEnabled.value);
    await storage.setPlayerDataByKey("masterEnabled", musicEnabled.value);
  }

  async function toggleSFX() {
    sfxEnabled.value = !sfxEnabled.value;
    soundManager.setMusic(sfxEnabled.value);
    await storage.setPlayerDataByKey("sfxEnabled", sfxEnabled.value);
  }

  async function setVolume(value: number) {
    masterVolume.value = value;
    soundManager.setMasterVolume(value);

    await storage.setPlayerDataByKey("masterVolume", value);
  }

  // загрузка сохранённых настроек
  async function loadFromStorage() {
    await storage
      .getPlayerDataByKey("masterEnabled")
      .then((v: boolean) => (masterEnabled.value = v ?? false));
    await storage
      .getPlayerDataByKey("musicEnabled")
      .then((v: boolean) => (musicEnabled.value = v ?? false));
    await storage
      .getPlayerDataByKey("masterVolume")
      .then((v: number) => (masterVolume.value = v ?? DEFAULT_VOLUME));
  }

  loadFromStorage();

  return {
    masterVolume,
    masterEnabled,
    musicEnabled,
    sfxEnabled,
    toggleMusic,
    toggleMaster,
    toggleSFX,
    setVolume,
  };
});
