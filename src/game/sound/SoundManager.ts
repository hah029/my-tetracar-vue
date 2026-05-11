import * as THREE from "three";
import type { AudioMap } from "./types";
import { useAudioStore } from "@/store/audioStore";
import { MUSICS, SFX } from "@/assets/sounds/index";

export class SoundManager {
  private static instance: SoundManager | null = null;
  private listener!: THREE.AudioListener;
  private loader: THREE.AudioLoader = new THREE.AudioLoader();
  private sounds: AudioMap = {};

  private currentMusic: THREE.Audio | null = null;
  private currentMusicName: string | null = null;
  private musicTimeout: number | null = null;

  private musicSet = new Set(MUSICS.keys);

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public initialize(camera: THREE.Camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    this.loader = new THREE.AudioLoader();
    Object.entries(MUSICS).forEach(([k, v]) => {
      this.load(k, v, this.sounds, 0.4);
    });
    Object.entries(SFX).forEach(([k, v]) => {
      this.load(k, v, this.sounds, 0.6);
    });
  }

  private load(
    name: string,
    path: string,
    storage: AudioMap,
    defaultVolume = 0.4,
  ) {
    const sound = new THREE.Audio(this.listener);
    this.loader.load(path, (buffer) => {
      sound.setBuffer(buffer);
      sound.setVolume(defaultVolume);
    });
    storage[name] = sound;
  }

  private stopCurrentMusic() {
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
    if (this.currentMusic?.isPlaying) {
      this.currentMusic.stop();
    }
    this.currentMusic = null;
    this.currentMusicName = null;
  }

  // Для обычных звуков (sfx)
  play(name: string) {
    const audioStore = useAudioStore();
    if (!audioStore.masterEnabled) return;

    const sound = this.sounds[name];
    if (!sound || !sound.buffer) return;

    const isMusic = this.musicSet.has(name);

    if (isMusic && !audioStore.musicEnabled) return;
    if (!isMusic && !audioStore.sfxEnabled) return;

    if (sound.isPlaying) sound.stop();
    sound.play();

    // Для музыки обновляем текущую
    if (isMusic) {
      this.stopCurrentMusic();
      this.currentMusic = sound;
      this.currentMusicName = name;
    }
  }

  // Метод для одноразовых звуков, которые не конфликтуют друг с другом
  playOneShot(name: string, volume: number = 0.6) {
    const audioStore = useAudioStore();
    if (!audioStore.masterEnabled || !audioStore.sfxEnabled) return;

    const originalSound = this.sounds[name];
    if (!originalSound?.buffer) return;

    // Создаём отдельный Audio для этого воспроизведения
    const tempSound = new THREE.Audio(this.listener);
    tempSound.setBuffer(originalSound.buffer);
    tempSound.setVolume(volume);
    tempSound.play();

    // Автоматическая очистка после окончания
    tempSound.onEnded = () => {
      tempSound.stop();
      tempSound.disconnect();
    };
  }

  // Новый метод для управления музыкой (с проверкой дублей)
  playMusic(name: string, loop: boolean = false) {
    const audioStore = useAudioStore();
    if (!audioStore.masterEnabled || !audioStore.musicEnabled) return;

    const sound = this.sounds[name];
    if (!sound?.buffer) return;

    // Если уже играет эта же музыка, ничего не делаем
    if (this.currentMusicName === name && this.currentMusic?.isPlaying) {
      return;
    }

    this.stopCurrentMusic();

    sound.setLoop(loop);
    sound.play();

    this.currentMusic = sound;
    this.currentMusicName = name;
  }

  // Последовательность (интро + зацикленная основа)
  playMusicSequence(intro: string, loop: string) {
    const audioStore = useAudioStore();
    if (!audioStore.masterEnabled || !audioStore.musicEnabled) return;

    const introSound = this.sounds[intro];
    const loopSound = this.sounds[loop];

    if (!introSound?.buffer || !loopSound?.buffer) return;

    this.stopCurrentMusic();

    introSound.setLoop(false);
    introSound.play();

    this.currentMusic = introSound;
    this.currentMusicName = intro;

    const duration = introSound.buffer.duration * 1000;

    this.musicTimeout = window.setTimeout(() => {
      if (!audioStore.musicEnabled) return;

      loopSound.setLoop(true);
      loopSound.play();

      this.currentMusic = loopSound;
      this.currentMusicName = loop;
    }, duration);
  }

  // Для обратной совместимости
  playLoop(loop: string) {
    this.playMusic(loop, true);
  }

  stop(name: string) {
    const sound = this.sounds[name];
    if (sound && sound.isPlaying) {
      sound.stop();
      if (this.currentMusic === sound) {
        this.currentMusic = null;
        this.currentMusicName = null;
      }
    }
  }

  stopAllMusic() {
    this.stopCurrentMusic();
  }

  resume() {
    const context = this.listener.context;
    if (context.state === "suspended") {
      context.resume();
    }
  }

  setMaster(enabled: boolean) {
    useAudioStore().masterEnabled = enabled;
    if (!enabled) {
      Object.values(this.sounds).forEach((s) => {
        if (s.isPlaying) s.stop();
      });
    }
  }

  setMusic(enabled: boolean) {
    useAudioStore().musicEnabled = enabled;
    if (!enabled) {
      this.stopAllMusic();
    }
  }

  setSFX(enabled: boolean) {
    useAudioStore().sfxEnabled = enabled;
  }

  toggleMaster() {
    this.setMaster(!useAudioStore().masterEnabled);
  }

  isPlaying(name: string) {
    return this.sounds[name]?.isPlaying;
  }

  setMasterVolume(volume: number) {
    localStorage.setItem("masterVolume", volume.toString());
    Object.values(this.sounds).forEach((sound) => {
      sound.setVolume(volume);
    });
  }

  fadeOut(name?: string, duration = 1) {
    let sound;
    if (name) {
      sound = this.sounds[name];
    } else {
      sound = this.currentMusic;
    }
    if (!sound || !sound.isPlaying) return;

    const startVolume = sound.getVolume();
    const startTime = performance.now();

    const fade = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = elapsed / duration;

      if (progress >= 1) {
        sound.stop();
        sound.setVolume(startVolume);
        if (sound === this.currentMusic) {
          this.currentMusic = null;
          this.currentMusicName = null;
        }
        return;
      }

      sound.setVolume(startVolume * (1 - progress));
      requestAnimationFrame(fade);
    };

    fade();
  }
}
