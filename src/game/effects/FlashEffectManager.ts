import * as THREE from "three";
import { loadTexture } from "@/helpers/loaders";

// Типы эффектов
export type FlashType = "golden" | "energon" | "nitro" | "shield" | "bullet";

// Конфигурация текстур для разных типов
const FLASH_TEXTURES: Record<FlashType, string> = {
  golden: "/src/assets/textures/flash_gold.svg",
  energon: "/src/assets/textures/flash_energon.svg",
  nitro: "/src/assets/textures/flash_nitro.svg",
  shield: "/src/assets/textures/flash_shield.svg",
  bullet: "/src/assets/textures/flash_bullet.svg",
};

interface FlashEffect {
  sprite: THREE.Sprite;
  createdAt: number;
  duration: number;
}

export class FlashEffectManager {
  private static instance: FlashEffectManager | null = null;
  private effects: FlashEffect[] = [];
  private scene: THREE.Scene | null = null;
  private textureCache: Map<string, THREE.Texture> = new Map();

  private constructor() {}

  public static getInstance(): FlashEffectManager {
    if (!FlashEffectManager.instance) {
      FlashEffectManager.instance = new FlashEffectManager();
    }
    return FlashEffectManager.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  private async getTexture(type: FlashType): Promise<THREE.Texture> {
    const url = FLASH_TEXTURES[type];

    if (this.textureCache.has(url)) {
      const cached = this.textureCache.get(url);
      if (cached) {
        return cached.clone();
      }
    }

    const texture = loadTexture(url);
    this.textureCache.set(url, texture);
    return texture.clone();
  }

  public async spawnFlash(
    type: FlashType,
    position: THREE.Vector3,
    duration: number = 300,
    size: number = 1.5,
  ): Promise<void> {
    if (!this.scene) {
      console.warn("FlashEffectManager not initialized");
      return;
    }

    const texture = await this.getTexture(type);

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 0.5;
    sprite.scale.set(size, size, 1);

    this.scene.add(sprite);

    this.effects.push({
      sprite,
      createdAt: performance.now(),
      duration,
    });
  }

  public update(currentTime: number = performance.now()): void {
    // ✅ Исправлено: проходим по индексам, чтобы безопасно удалять
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      if (!effect) continue; // защита от undefined

      const elapsed = currentTime - effect.createdAt;
      const progress = elapsed / effect.duration;

      if (progress >= 1) {
        // Эффект закончился — удаляем
        if (this.scene) {
          this.scene.remove(effect.sprite);
        }
        effect.sprite.material.dispose();
        this.effects.splice(i, 1);
      } else {
        // Плавное затухание
        const opacity = 1 - progress;
        (effect.sprite.material as THREE.SpriteMaterial).opacity = opacity;

        // Небольшое увеличение размера при затухании
        const scale = 1.5 + progress * 0.5;
        effect.sprite.scale.set(scale, scale, 1);
      }
    }
  }

  public clear(): void {
    for (const effect of this.effects) {
      if (this.scene) {
        this.scene.remove(effect.sprite);
      }
      effect.sprite.material.dispose();
    }
    this.effects = [];
  }
}
