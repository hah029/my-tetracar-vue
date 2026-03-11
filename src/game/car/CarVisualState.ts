import * as THREE from "three";
import { loadTexture } from "@/helpers/loaders";

export type CarVisualEffect = "nitro" | "shield" | "damage";

export type TextureMap = Record<CarVisualEffect | "default", string>;

export class CarVisualState {
  private meshes: THREE.Mesh[] = [];

  private textures = new Map<CarVisualEffect | "default", THREE.Texture>();

  private emissiveColors = new Map<CarVisualEffect | "default", THREE.Color>();
  private emissiveMaps = new Map<
    CarVisualEffect | "default",
    THREE.Texture | null
  >();

  private activeEffects = new Set<CarVisualEffect>();

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
    this.emissiveMaps.set("default", null);
  }

  preloadTextures(textureMap: TextureMap) {
    Object.entries(textureMap).forEach(([mode, url]) => {
      const texture = loadTexture(url);
      texture.flipY = false;

      this.textures.set(mode as CarVisualEffect | "default", texture);
    });
  }

  setEmissiveColor(
    effect: CarVisualEffect | "default",
    color: THREE.Color | number | string,
  ) {
    this.emissiveColors.set(effect, new THREE.Color(color));
  }

  setEmissiveMap(
    effect: CarVisualEffect | "default",
    map: THREE.Texture | null,
  ) {
    this.emissiveMaps.set(effect, map);
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
      }
      if (material.map !== nextTexture) {
        material.map = nextTexture;
      }

      // Выбор emissive цвета и карты
      let emissiveColor = defaultEmissiveColor;

      if (tag !== "default" && this.activeEffects.has(tag)) {
        // Если для эффекта задан свой цвет/карта — используем их, иначе оставляем default
        const effectColor = this.emissiveColors.get(tag);
        if (effectColor !== undefined) emissiveColor = effectColor;
      }

      material.emissive.copy(emissiveColor);
      material.emissiveIntensity = 2.5;
    }
  }
}
