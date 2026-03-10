import * as THREE from "three";
import { loadTexture } from "@/helpers/loaders";

export type CarVisualEffect = "nitro" | "shield" | "damage";

type TextureMap = Record<CarVisualEffect | "default", string>;

export class CarVisualState {
  private meshes: THREE.Mesh[] = [];

  private textures = new Map<string, THREE.Texture>();

  private activeEffects = new Set<CarVisualEffect>();

  constructor(cubes: THREE.Object3D[]) {
    cubes.forEach((cube) => {
      cube.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData = cube.userData;
          this.meshes.push(child);
        }
      });
    });
  }

  preloadTextures(textureMap: TextureMap) {
    Object.entries(textureMap).forEach(([mode, url]) => {
      const texture = loadTexture(url);
      texture.flipY = false;

      this.textures.set(mode, texture);
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
    this.activeEffects.clear();
    this.updateVisual();
  }

  private updateVisual() {
    let texture = this.textures.get("default");
    if (!texture) {
      console.warn("[CarVisualState] no texture found, skipping update");
      return;
    }

    let cubeMapping = {
      damage: texture,
      shield: texture,
      nitro: texture,
    };

    // приоритет эффектов
    if (this.activeEffects.has("damage")) {
      cubeMapping["damage"] = this.textures.get("damage") ?? texture;
    }
    if (this.activeEffects.has("shield")) {
      cubeMapping["shield"] = this.textures.get("shield") ?? texture;
    }
    if (this.activeEffects.has("nitro")) {
      cubeMapping["nitro"] = this.textures.get("nitro") ?? texture;
    }

    this.meshes
      .filter((mesh) => mesh.userData.name != "no-color")
      .forEach((mesh) => {
        const material = mesh.material as THREE.MeshStandardMaterial;

        if (!material) {
          console.warn("[CarVisualState] mesh has no material", mesh);
          return;
        }
        material.map = cubeMapping[mesh.userData.name];
        material.needsUpdate = true;
      });
  }
}
