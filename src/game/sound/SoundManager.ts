import * as THREE from "three";
import type { AudioMap } from "./types";
import { SOUNDS_CONFIG } from "./config";
import { useAudioStore } from "@/store/audioStore";

export class SoundManager {
  private static instance: SoundManager | null = null;
  private listener!: THREE.AudioListener;
  private loader: THREE.AudioLoader = new THREE.AudioLoader();
  private sounds: AudioMap = {};

  private currentMusic: THREE.Audio | null = null;
  private musicTimeout: number | null = null;

  private musicSet = new Set([
    "music_intro",
    "music_background",
    "music_gameover",
  ]);

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
    Object.entries(SOUNDS_CONFIG).forEach(([k, v]) => {
      // const isMusic = k.startsWith("music_background");
      this.load(k, v);
    });
  }

  private load(name: string, path: string) {
    const sound = new THREE.Audio(this.listener);

    this.loader.load(path, (buffer) => {
      sound.setBuffer(buffer);

      if (this.musicSet.has(name)) {
        sound.setVolume(0.4);
      } else {
        sound.setVolume(0.6);
      }
    });

    this.sounds[name] = sound;
  }

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
  }

  playMusicSequence(intro: string, loop: string) {
    const audioStore = useAudioStore();
    if (!audioStore.masterEnabled || !audioStore.musicEnabled) return;

    const introSound = this.sounds[intro];
    const loopSound = this.sounds[loop];

    if (!introSound?.buffer || !loopSound?.buffer) return;

    this.stopAllMusic();

    introSound.setLoop(false);
    introSound.play();

    this.currentMusic = introSound;

    const duration = introSound.buffer.duration * 1000;

    this.musicTimeout = window.setTimeout(() => {
      if (!audioStore.musicEnabled) return;

      loopSound.setLoop(true);
      loopSound.play();

      this.currentMusic = loopSound;
    }, duration);
  }

  stop(name: string) {
    const sound = this.sounds[name];
    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }

  stopAllMusic() {
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
    if (this.currentMusic?.isPlaying) {
      this.currentMusic.stop();
    }
    this.currentMusic = null;
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
      this.musicSet.forEach((name) => this.stop(name));
    }
  }

  setSFX(enabled: boolean) {
    useAudioStore().sfxEnabled = enabled;
  }

  toggleMaster() {
    this.setMaster(!useAudioStore().masterEnabled);
  }

  isPlaying(sound: string) {
    return this.sounds[sound]?.isPlaying;
  }

  setMasterVolume(volume: number) {
    Object.values(this.sounds).forEach((sound) => {
      sound.setVolume(volume);
    });
  }

  fadeOut(name: string, duration = 1) {
    const sound = this.sounds[name];
    if (!sound || !sound.isPlaying) return;

    const startVolume = sound.getVolume();
    const startTime = performance.now();

    const fade = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = elapsed / duration;

      if (progress >= 1) {
        sound.stop();
        sound.setVolume(startVolume);
        return;
      }

      sound.setVolume(startVolume * (1 - progress));
      requestAnimationFrame(fade);
    };

    fade();
  }
}
