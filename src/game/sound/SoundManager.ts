import * as THREE from "three";
import type { AudioMap } from "./types";
import { useAudioStore } from "@/store/audioStore";
import { MUSICS, SFX } from "@/assets/sounds/index";
import { AUDIO_CUES, type AudioCue } from "@/configs/audio";

export class SoundManager {
  private static instance: SoundManager | null = null;
  private listener!: THREE.AudioListener;
  private loader: THREE.AudioLoader = new THREE.AudioLoader();
  private sounds: AudioMap = {};
  private activeSfxLoops = new Map<AudioCue, THREE.Audio>();
  private baseVolumes = new Map<string, number>();

  private currentMusic: THREE.Audio | null = null;
  private currentMusicName: string | null = null;
  private musicTimeout: number | null = null;

  private musicSet = new Set(Object.keys(MUSICS));

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

    // Браузеры создают AudioContext в состоянии suspended, если он создан до
    // первого действия игрока. Разблокируем его на первом возможном жесте.
    const unlockAudio = () => void this.resume();
    window.addEventListener("pointerdown", unlockAudio, {
      once: true,
      capture: true,
    });
    window.addEventListener("keydown", unlockAudio, {
      once: true,
      capture: true,
    });
  }

  private load(
    name: string,
    path: string,
    storage: AudioMap,
    defaultVolume = 0.4,
  ) {
    const sound = new THREE.Audio(this.listener);
    this.loader.load(
      path,
      (buffer) => {
        sound.setBuffer(buffer);
        sound.setVolume(defaultVolume);
        this.baseVolumes.set(name, defaultVolume);
      },
      undefined,
      (error) => console.error(`Failed to load audio "${name}"`, error),
    );
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
  play(name: string, volumeMultiplier = 1) {
    const audioStore = useAudioStore();
    if (!audioStore.masterEnabled) return;
    void this.resume();

    const sound = this.sounds[name];
    if (!sound || !sound.buffer) return;

    const isMusic = this.musicSet.has(name);

    if (isMusic && !audioStore.musicEnabled) return;
    if (!isMusic && !audioStore.sfxEnabled) return;

    if (isMusic) {
      this.stopCurrentMusic();
    }
    if (sound.isPlaying) sound.stop();
    this.applyVolume(sound, name, volumeMultiplier);
    sound.play();

    // Для музыки обновляем текущую
    if (isMusic) {
      this.currentMusic = sound;
      this.currentMusicName = name;
    }
  }

  // Метод для одноразовых звуков, которые не конфликтуют друг с другом
  playOneShot(name: string, volumeMultiplier = 1) {
    const audioStore = useAudioStore();
    if (!audioStore.masterEnabled || !audioStore.sfxEnabled) return;
    void this.resume();

    const originalSound = this.sounds[name];
    if (!originalSound?.buffer) return;

    // Создаём отдельный Audio для этого воспроизведения
    const tempSound = new THREE.Audio(this.listener);
    tempSound.setBuffer(originalSound.buffer);
    this.applyVolume(tempSound, name, volumeMultiplier);
    tempSound.play();

    // Автоматическая очистка после окончания
    tempSound.onEnded = () => {
      tempSound.stop();
      tempSound.disconnect();
    };
  }

  /** Воспроизвести звук по игровому событию, а не по имени файла. */
  playCue(cue: AudioCue) {
    const config = AUDIO_CUES[cue];
    this.play(config.sound, config.volume);
  }

  /** Вариант для событий, которым разрешено накладываться друг на друга. */
  playCueOneShot(cue: AudioCue, volume?: number) {
    const config = AUDIO_CUES[cue];
    this.playOneShot(config.sound, config.volume * (volume ?? 1));
  }

  startCueLoop(cue: AudioCue, volumeMultiplier = 1) {
    const audioStore = useAudioStore();
    if (!audioStore.masterEnabled || !audioStore.sfxEnabled) return;
    if (this.activeSfxLoops.has(cue)) return;

    void this.resume();
    const config = AUDIO_CUES[cue];
    const originalSound = this.sounds[config.sound];
    if (!originalSound?.buffer) return;

    const loop = new THREE.Audio(this.listener);
    loop.setBuffer(originalSound.buffer);
    loop.setLoop(true);
    this.applyVolume(loop, config.sound, config.volume * volumeMultiplier);
    loop.play();
    this.activeSfxLoops.set(cue, loop);
  }

  stopCueLoop(cue: AudioCue) {
    const loop = this.activeSfxLoops.get(cue);
    if (!loop) return;

    loop.stop();
    loop.disconnect();
    this.activeSfxLoops.delete(cue);
  }

  // Новый метод для управления музыкой (с проверкой дублей)
  playMusic(name: string, loop: boolean = false) {
    const audioStore = useAudioStore();
    if (!audioStore.masterEnabled || !audioStore.musicEnabled) return;
    void this.resume();

    const sound = this.sounds[name];
    if (!sound?.buffer) return;

    // Если уже играет эта же музыка, ничего не делаем
    if (this.currentMusicName === name && this.currentMusic?.isPlaying) {
      return;
    }

    this.stopCurrentMusic();

    sound.setLoop(loop);
    this.applyVolume(sound, name);
    sound.play();

    this.currentMusic = sound;
    this.currentMusicName = name;
  }

  // Последовательность (интро + зацикленная основа)
  playMusicSequence(intro: string, loop: string) {
    const audioStore = useAudioStore();
    if (!audioStore.masterEnabled || !audioStore.musicEnabled) return;
    void this.resume();

    const introSound = this.sounds[intro];
    const loopSound = this.sounds[loop];

    if (!introSound?.buffer || !loopSound?.buffer) return;

    this.stopCurrentMusic();

    introSound.setLoop(false);
    this.applyVolume(introSound, intro);
    introSound.play();

    this.currentMusic = introSound;
    this.currentMusicName = intro;

    const duration = introSound.buffer.duration * 1000;

    this.musicTimeout = window.setTimeout(() => {
      if (!audioStore.musicEnabled) return;

      loopSound.setLoop(true);
      this.applyVolume(loopSound, loop);
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

  async resume() {
    const context = this.listener.context;
    if (context.state === "suspended") {
      await context.resume();
    }
  }

  async suspend() {
    const context = this.listener.context;
    if (context.state === "running") {
      await context.suspend();
    }
  }

  setMaster(enabled: boolean) {
    useAudioStore().masterEnabled = enabled;
    if (!enabled) {
      Object.values(this.sounds).forEach((s) => {
        if (s.isPlaying) s.stop();
      });
      this.activeSfxLoops.forEach((_, cue) => this.stopCueLoop(cue));
    }
  }

  setMusic(enabled: boolean) {
    useAudioStore().musicEnabled = enabled;
    if (!enabled) {
      this.stopAllMusic();
    }
  }

  toggleMaster() {
    this.setMaster(!useAudioStore().masterEnabled);
  }

  isPlaying(name: string) {
    return this.sounds[name]?.isPlaying;
  }

  setMasterVolume(volume: number) {
    Object.values(this.sounds).forEach((sound) => {
      const name = Object.entries(this.sounds).find(([, value]) => value === sound)?.[0];
      if (name) {
        this.applyVolume(
          sound,
          name,
          sound.userData.audioVolumeMultiplier ?? 1,
        );
      }
    });
    this.activeSfxLoops.forEach((sound, cue) => {
      const config = AUDIO_CUES[cue];
      this.applyVolume(sound, config.sound, config.volume);
    });
  }

  private applyVolume(
    sound: THREE.Audio,
    name: string,
    volumeMultiplier = 1,
  ) {
    const masterVolume = useAudioStore().masterVolume;
    const baseVolume = this.baseVolumes.get(name) ?? 0.6;
    sound.userData.audioVolumeMultiplier = volumeMultiplier;
    sound.setVolume(baseVolume * masterVolume * volumeMultiplier);
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
