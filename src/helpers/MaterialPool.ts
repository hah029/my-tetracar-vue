import * as THREE from "three";
import {
  loadTexture,
  type TextureOptions,
} from "@/helpers/loaders/loadTexture";
import { atlas } from "@/assets/textures/TextureAtlas";
import { useCommonStore } from "@/store/commonStore";

export interface MaterialConfig {
  type: "standard" | "standardWithMap" | "atlas";
  key?: string; // Уникальный ключ для кэша
  color?: number;
  textureUrl?: string;
  textureOptions?: TextureOptions;
  atlasSprite?: string;
  emissive?: number;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}

class MaterialPoolClass {
  private materials = new Map<string, THREE.Material>();

  /**
   * Получить или создать материал
   */
  getMaterial(config: MaterialConfig): THREE.Material {
    // Генерируем уникальный ключ
    const key = config.key || this.generateKey(config);

    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const material = this.createMaterial(config);
    this.materials.set(key, material);

    console.log(
      `🆕 New material created: ${key}. Total: ${this.materials.size}`,
    );
    return material;
  }

  private generateKey(config: MaterialConfig): string {
    return JSON.stringify({
      type: config.type,
      color: config.color,
      textureUrl: config.textureUrl,
      atlasSprite: config.atlasSprite,
      emissive: config.emissive,
      emissiveIntensity: config.emissiveIntensity,
      transparent: config.transparent,
      opacity: config.opacity,
    });
  }

  private createMaterial(config: MaterialConfig): THREE.Material {
    const material = new THREE.MeshStandardMaterial({
      color: config.color ?? 0xffffff,
      emissive: config.emissive ?? 0x000000,
      emissiveIntensity: config.emissiveIntensity ?? 1,
      transparent: config.transparent ?? false,
      opacity: config.opacity ?? 1,
      side: config.side ?? THREE.FrontSide,
    });

    // Настройка текстуры
    if (config.type === "standardWithMap" && config.textureUrl) {
      const texture = loadTexture(config.textureUrl, config.textureOptions);
      material.map = texture;
    }

    if (config.type === "atlas" && config.atlasSprite) {
      const atlasTexture = atlas.getAtlasTexture();
      const sprite = atlas.getSprite(config.atlasSprite);

      if (atlasTexture) {
        material.map = atlasTexture;

        if (sprite) {
          material.map.repeat.set(sprite.uvRect.w, sprite.uvRect.h);
          material.map.offset.set(sprite.uvRect.u, sprite.uvRect.v);
        }
      }
    }

    return material;
  }

  // ========== НОВЫЕ МЕТОДЫ ДЛЯ МОНЕТ И БУСТЕРОВ ==========

  getGoldenMaterial(): THREE.Material {
    return this.getMaterial({
      type: "standardWithMap",
      key: "golden_coin",
      textureUrl: useCommonStore().config.materials.golden.textureUrl,
      emissive: useCommonStore().config.materials.golden.emissive,
      emissiveIntensity:
        useCommonStore().config.materials.golden.emissiveIntensity,
    });
  }

  getEnergonMaterial(): THREE.Material {
    return this.getMaterial({
      type: "standard",
      key: "energon_coin",
      color: 0x82c8e5,
      emissive: 0x82c8e5,
      emissiveIntensity: 0.6,
    });
  }

  getNitroMaterial(): THREE.Material {
    return this.getMaterial({
      type: "standard",
      key: "nitro_booster",
      color: 0x00dd00,
      emissive: 0x00dd00,
      emissiveIntensity: 0.6,
    });
  }

  getShieldMaterial(): THREE.Material {
    return this.getMaterial({
      type: "standard",
      key: "shield_booster",
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.6,
    });
  }

  getMagnetMaterial(): THREE.Material {
    return this.getMaterial({
      type: "standard",
      key: "magnet_booster",
      color: 0x0088ff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.6,
    });
  }

  getBulletMaterial(): THREE.Material {
    return this.getMaterial({
      type: "standard",
      key: "bullet_booster",
      color: 0xdd0000,
      emissive: 0xdd0000,
      emissiveIntensity: 0.6,
    });
  }

  // ========== КОНЕЦ НОВЫХ МЕТОДОВ ==========

  /**
   * Получить статистику пула (для отладки)
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.materials.size,
      keys: Array.from(this.materials.keys()),
    };
  }

  /**
   * Очистить пул (при перезагрузке игры)
   */
  dispose(): void {
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
  }
}

export const MaterialPool = new MaterialPoolClass();
