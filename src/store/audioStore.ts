// src/store/audioStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { SoundManager } from "@/game/sound/SoundManager";
import { Platform } from "@/sdk/Platform";
import audio from "@/configs/audio";

export const useAudioStore = defineStore("audio", () => {
  const storage = Platform.getInstance();

  // Общий переключатель в интерфейсе не показывается, поэтому звук должен быть
  // включён, пока игрок явно не отключил его через платформенную интеграцию.
  const masterEnabled = ref(true);
  const musicEnabled = ref(false);
  const sfxEnabled = ref(false);
  const masterVolume = ref(audio.default_volume);

  const soundManager = SoundManager.getInstance();

  async function toggleMusic() {
    musicEnabled.value = !musicEnabled.value;
    soundManager.setMusic(musicEnabled.value);
    await storage.setPlayerDataByKey("musicEnabled", musicEnabled.value);
  }

  async function toggleMaster() {
    masterEnabled.value = !masterEnabled.value;
    soundManager.setMaster(masterEnabled.value);
    await storage.setPlayerDataByKey("masterEnabled", masterEnabled.value);
  }

  async function toggleSFX() {
    sfxEnabled.value = !sfxEnabled.value;
    await storage.setPlayerDataByKey("sfxEnabled", sfxEnabled.value);
  }

  async function setVolume(value: number) {
    masterVolume.value = value;
    soundManager.setMasterVolume(value);

    await storage.setPlayerDataByKey("masterVolume", value);
  }

  // загрузка сохранённых настроек
  async function loadFromStorage() {
    const data = await storage.getPlayerData();
    const hasMusicSetting = typeof data?.musicEnabled === "boolean";
    const hasSfxSetting = typeof data?.sfxEnabled === "boolean";
    const hasVolumeSetting = typeof data?.masterVolume === "number";

    // В интерфейсе нет общего переключателя. Старые сохранения содержат
    // masterEnabled: false, который иначе навсегда блокирует весь звук.
    masterEnabled.value = true;
    musicEnabled.value = hasMusicSetting ? data.musicEnabled : true;
    sfxEnabled.value = hasSfxSetting ? data.sfxEnabled : true;
    masterVolume.value = hasVolumeSetting
      ? data.masterVolume
      : audio.default_volume;

    // Для новых игроков (и старых сохранений без аудио-полей) сохраняем
    // значения сразу, а не только после первого клика в настройках.
    if (!hasMusicSetting || !hasSfxSetting || !hasVolumeSetting) {
      await storage.setPlayerData({
        ...(data ?? {}),
        masterEnabled: true,
        musicEnabled: musicEnabled.value,
        sfxEnabled: sfxEnabled.value,
        masterVolume: masterVolume.value,
      });
    }
  }

  const ready = loadFromStorage();

  return {
    masterVolume,
    masterEnabled,
    musicEnabled,
    sfxEnabled,
    toggleMusic,
    toggleMaster,
    toggleSFX,
    setVolume,
    ready,
  };
});
