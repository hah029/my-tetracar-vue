// src/game/interactive/items/BaseItem.ts

import * as THREE from "three";
import { RoadManager } from "@/game/environment/road";
import type { ItemType } from "./types";
import type { MaterialConfig } from "@/game/cube/types";
import { CubeBuilder } from "@/game/cube/Cube";
import { useCommonStore } from "@/store/commonStore";

type EmissiveMaterial = THREE.Material & {
  emissive: THREE.Color;
  emissiveIntensity: number;
};

type DisposableMaterial = THREE.Material & {
  dispose: () => void;
};

export class BaseItem extends THREE.Group {
  public collider: THREE.Sphere;
  public itemType!: ItemType;
  protected cube: THREE.Object3D = new THREE.Object3D();
  protected rotationYDiff = useCommonStore().config.baseItemRotation;
  protected initialPosition: THREE.Vector3;
  protected existingMaterial?: THREE.Material; // 👈 НОВОЕ ПОЛЕ

  constructor(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos: number = useCommonStore().baseItemYpos,
    material: MaterialConfig | null = null,
    existingMaterial?: THREE.Material, // 👈 НОВЫЙ ПАРАМЕТР
  ) {
    super();
    this.userData = {
      isInteractiveItem: true,
      status: "landed",
      velocity: new THREE.Vector3(),
      rotationSpeed: new THREE.Vector3(),
      laneIndex,
      followSurface: laneIndex !== undefined,
    };

    let x: number;
    if (xPos !== undefined) {
      x = xPos;
    } else if (laneIndex !== undefined) {
      x = RoadManager.getInstance().getLanePosition(laneIndex);
    } else {
      throw new Error("Either laneIndex or xPos must be provided");
    }

    this.initialPosition = new THREE.Vector3(x, yPos, zPos);
    this.position.copy(this.initialPosition);
    this.cube.position.set(0, 0, 0);
    this.collider = new THREE.Sphere(this.position.clone(), 0.45);
    this.existingMaterial = existingMaterial; // 👈 СОХРАНЯЕМ
    this.build(material).catch((err) => {
      console.error("[Coin] build failed:", err);
    });
  }

  async build(material: MaterialConfig | null = null): Promise<void> {
    const config = {
      useGLB: true,
      geomConfig: useCommonStore().itemGeometryConfig,
      useTexture: material != null,
      materialConfig: material != null ? material : undefined,
      existingMaterial: this.existingMaterial, // ПЕРЕДАЁМ ГОТОВЫЙ МАТЕРИАЛ
    };

    try {
      this.cube = await CubeBuilder.build(config);
      this.cube.position.set(0, 0, 0);
      this.add(this.cube);
      this.ensureLethalMagnetObstacleVisual();
    } catch (error) {
      console.error("[Coin] build error:", error);
      throw error;
    }
  }

  update(deltaTime: number, speed: number): boolean {
    this.position.z += deltaTime * speed;
    this.updateSurfaceHeight();
    this.cube.rotation.y += this.rotationYDiff;
    this.ensureLethalMagnetObstacleVisual();
    this.updateCorruptedEmission(deltaTime);
    this.collider.center.copy(this.position);
    return this.position.z > useCommonStore().config.itemsRemovingZpos;
  }

  private updateSurfaceHeight(): void {
    if (this.userData.status !== "landed") return;
    if (this.userData.followSurface === false) return;
    if (typeof this.userData.laneIndex !== "number") return;

    const road = RoadManager.getInstance();
    this.position.y =
      useCommonStore().baseItemYpos +
      road.getSurfaceHeightAt(this.userData.laneIndex, this.position.z);
  }

  public markAsLethalMagnetObstacle() {
    this.userData.lethalMagnetObstacleVisual = true;
    this.ensureLethalMagnetObstacleVisual();
  }

  public disposeCorruptedBoostMaterials() {
    const materials = this.userData.corruptedBoostMaterials as
      | EmissiveMaterial[]
      | undefined;
    materials?.forEach((material) => material.dispose());
    this.userData.corruptedBoostMaterials = undefined;

    const obstacleMaterials = this.userData.lethalMagnetObstacleMaterials as
      | DisposableMaterial[]
      | undefined;
    obstacleMaterials?.forEach((material) => material.dispose());
    this.userData.lethalMagnetObstacleMaterials = undefined;
  }

  private updateCorruptedEmission(deltaTime: number) {
    const pulseConfig = this.userData.corruptedBoostPulse as
      | { color: number; time: number }
      | undefined;
    if (!pulseConfig) return;

    this.ensureCorruptedBoostMaterials();

    const materials = this.userData.corruptedBoostMaterials as
      | EmissiveMaterial[]
      | undefined;
    if (!materials?.length) return;

    pulseConfig.time += deltaTime;
    const intensity = 0.75 + Math.sin(pulseConfig.time * 0.014) * 0.45;

    materials.forEach((material) => {
      material.emissive.setHex(pulseConfig.color);
      material.emissiveIntensity = intensity;
    });
  }

  private ensureCorruptedBoostMaterials() {
    if (this.userData.corruptedBoostMaterialsReady) return;

    const materials: EmissiveMaterial[] = [];

    this.cube.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      const sourceMaterials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      const clonedMaterials = sourceMaterials.map((material) => {
        const clone = material.clone();
        if (this.isEmissiveMaterial(clone)) {
          clone.needsUpdate = true;
          materials.push(clone);
        }
        return clone;
      });

      mesh.material = Array.isArray(mesh.material)
        ? clonedMaterials
        : clonedMaterials[0];
    });

    this.userData.corruptedBoostMaterials = materials;
    this.userData.corruptedBoostMaterialsReady = materials.length > 0;
  }

  private ensureLethalMagnetObstacleVisual() {
    if (!this.userData.lethalMagnetObstacleVisual) return;
    if (this.userData.lethalMagnetObstacleMaterialsReady) return;

    const materials: THREE.Material[] = [];
    let hasMesh = false;

    this.cube.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      hasMesh = true;
      const material = new THREE.MeshStandardMaterial({
        color: 0x050505,
        emissive: 0x000000,
        emissiveIntensity: 0,
        roughness: 0.85,
        metalness: 0.15,
      });

      mesh.material = material;
      materials.push(material);
    });

    if (!hasMesh) return;

    this.userData.lethalMagnetObstacleMaterials = materials;
    this.userData.lethalMagnetObstacleMaterialsReady = true;
  }

  private isEmissiveMaterial(
    material: THREE.Material,
  ): material is EmissiveMaterial {
    return "emissive" in material && "emissiveIntensity" in material;
  }
}
