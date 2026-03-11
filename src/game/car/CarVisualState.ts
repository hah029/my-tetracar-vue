import * as THREE from "three";
import { loadTexture } from "@/helpers/loaders";

export type CarVisualEffect = "nitro" | "shield" | "damage";

type TextureMap = Record<CarVisualEffect | "default", string>;

export class CarVisualState {
  private meshes: THREE.Mesh[] = [];

  private textures = new Map<CarVisualEffect | "default", THREE.Texture>();

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
  }

  preloadTextures(textureMap: TextureMap) {
    Object.entries(textureMap).forEach(([mode, url]) => {
      const texture = loadTexture(url);
      texture.flipY = false;

      this.textures.set(mode as CarVisualEffect | "default", texture);
    });
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
    if (!defaultTexture) return;

    for (const mesh of this.meshes) {
      const tag = mesh.userData.name as CarVisualEffect | "default";

      const material = mesh.material as THREE.MeshStandardMaterial;
      if (!material) continue;

      let nextTexture = defaultTexture;

      if (tag !== "default" && this.activeEffects.has(tag)) {
        nextTexture = this.textures.get(tag) ?? defaultTexture;
      }

      if (material.map !== nextTexture) {
        material.map = nextTexture;
        material.needsUpdate = true;
      }
    }
  }
}
