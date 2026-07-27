import * as THREE from "three";
import { atlas } from "@/assets/textures/TextureAtlas";
import type { AtlasSpriteName } from "@/assets/textures/atlasSprites";
import { usePlayerStore } from "@/store/playerStore";

export type CarVisualEffect = "nitro" | "shield" | "damage" | "default";

export type TextureMap = Record<CarVisualEffect, AtlasSpriteName>;

export class CarVisualState {
  private meshes: THREE.Mesh[] = [];
  private textures = new Map<CarVisualEffect, THREE.Texture>();
  private emissiveColors = new Map<CarVisualEffect, THREE.Color>();
  private activeEffects = new Set<CarVisualEffect>();
  private playerStore = usePlayerStore();
  private effectPulseTime = 0;
  private wasCorruptedNitroActive = false;
  private wasCorruptedShieldActive = false;

  private blinkDuration = 0; // сколько длится cooldown
  private isBlinking = false;
  private blinkTime = 0;
  private blinkSpeed = usePlayerStore().DEFAULT_BLINK_SPEED; // частота мигания

  constructor(cubes: THREE.Object3D[]) {
    cubes.forEach((cube) => {
      cube.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData = {
            ...child.userData,
            name: cube.userData.name,
          };
          this.meshes.push(child);
        }
      });
    });

    this.emissiveColors.set("default", new THREE.Color(0x000000));
  }

  preloadTextures(textureMap: TextureMap) {
    Object.entries(textureMap).forEach(([mode, spriteName]) => {
      const texture = this.createAtlasTexture(spriteName);
      if (!texture) return;

      this.textures.set(mode as CarVisualEffect, texture);
    });
  }

  private createAtlasTexture(spriteName: AtlasSpriteName): THREE.Texture | null {
    const atlasTexture = atlas.getAtlasTexture();
    const sprite = atlas.getSprite(spriteName);
    if (!atlasTexture || !sprite) return null;

    const texture = atlasTexture.clone();
    texture.repeat.set(sprite.uvRect.w, sprite.uvRect.h);
    texture.offset.set(sprite.uvRect.u, sprite.uvRect.v);
    texture.needsUpdate = true;
    return texture;
  }

  startBlink(duration: number = this.playerStore.DEFAULT_BLINK_DURATION) {
    this.isBlinking = true;
    this.blinkTime = 0;
    this.blinkDuration = duration;
  }

  update(dt: number) {
    this.updateCorruptedEffectPulse(dt);

    if (this.isBlinking) {
      this.blinkTime += dt / 1000;

      const pulse = Math.sin(this.blinkTime * this.blinkSpeed) * 0.5 + 0.5;

      for (const mesh of this.meshes) {
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.opacity = pulse;
      }

      if (this.blinkTime >= this.blinkDuration) {
        this.isBlinking = false;

        for (const mesh of this.meshes) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.opacity = 1;
        }
      }
    }
  }

  setEmissiveColor(
    effect: CarVisualEffect,
    color: THREE.Color | number | string,
  ) {
    this.emissiveColors.set(effect, new THREE.Color(color));
  }

  refresh() {
    this.updateVisual();
  }

  enable(effect: CarVisualEffect) {
    if (this.activeEffects.has(effect)) return;

    this.activeEffects.add(effect);
    this.updateVisual();
  }

  disable(effect: CarVisualEffect) {
    if (!this.activeEffects.has(effect)) return;

    this.activeEffects.delete(effect);
    this.updateVisual();
  }

  clear() {
    if (this.activeEffects.size === 0) return;

    this.activeEffects.clear();
    this.updateVisual();
  }

  private updateVisual() {
    const defaultTexture = this.textures.get("default");
    const defaultEmissiveColor =
      this.emissiveColors.get("default") || new THREE.Color(0x000000);

    for (const mesh of this.meshes) {
      const tag = mesh.userData.name as CarVisualEffect | "default";
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (!material) continue;

      // Выбор обычной текстуры (как было)
      let nextTexture = defaultTexture;
      if (tag !== "default" && this.activeEffects.has(tag)) {
        nextTexture = this.textures.get(tag) ?? defaultTexture;
        // console.log(
        //   "[DEBUG CarVisualState.updateVisual] mesh tag=%s, applying texture:",
        //   tag,
        //   nextTexture?.image?.src ?? "none",
        // );
      }
      if (material.map !== nextTexture) {
        material.map = nextTexture || null;
        material.needsUpdate = true;
      }

      // Выбор emissive цвета и карты
      let emissiveColor = defaultEmissiveColor;

      if (tag !== "default" && this.activeEffects.has(tag)) {
        // Если для эффекта задан свой цвет/карта — используем их, иначе оставляем default
        const effectColor = this.emissiveColors.get(tag);
        if (effectColor !== undefined) emissiveColor = effectColor;
      }

      material.emissive.copy(emissiveColor);

      let emissiveIntensity = this.playerStore.DEFAULT_EMISSION_INTENSITY;
      if (tag === "nitro") emissiveIntensity *= 2;
      material.emissiveIntensity = emissiveIntensity;
    }
  }

  private updateCorruptedEffectPulse(dt: number) {
    const corruptedShieldActive =
      this.activeEffects.has("shield") && this.playerStore.corruptedShieldEnabled;
    const corruptedNitroActive =
      this.activeEffects.has("nitro") && this.playerStore.corruptedNitroEnabled;

    if (
      this.wasCorruptedShieldActive !== corruptedShieldActive ||
      this.wasCorruptedNitroActive !== corruptedNitroActive
    ) {
      this.wasCorruptedShieldActive = corruptedShieldActive;
      this.wasCorruptedNitroActive = corruptedNitroActive;
      this.updateVisual();
    }

    if (!corruptedShieldActive && !corruptedNitroActive) return;

    this.effectPulseTime += dt / 1000;

    for (const mesh of this.meshes) {
      const tag = mesh.userData.name as CarVisualEffect | "default";
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (!material) continue;

      if (tag === "shield" && corruptedShieldActive) {
        this.applyPulse(mesh, material, {
          color: 0xf7fbff,
          baseIntensity: this.playerStore.DEFAULT_EMISSION_INTENSITY * 1.1,
          amplitude: 2.2,
          speed: 7.5,
        });
        continue;
      }

      if (tag === "nitro" && corruptedNitroActive) {
        this.applyPulse(mesh, material, {
          color: 0xff2a7a,
          baseIntensity: this.playerStore.DEFAULT_EMISSION_INTENSITY * 2.2,
          amplitude: 3.4,
          speed: 4.2,
        });
      }
    }
  }

  private applyPulse(
    mesh: THREE.Mesh,
    material: THREE.MeshStandardMaterial,
    config: {
      color: number;
      baseIntensity: number;
      amplitude: number;
      speed: number;
    },
  ) {
    const pulse = Math.sin(this.effectPulseTime * config.speed) * 0.5 + 0.5;
    material.emissive.setHex(config.color);
    material.emissiveIntensity =
      config.baseIntensity + pulse * config.amplitude;
  }

  public has(effect: CarVisualEffect): boolean {
    return this.activeEffects.has(effect);
  }
}
