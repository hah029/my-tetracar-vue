import * as THREE from "three";
import { BaseObstacle } from "./BaseObstacle";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import type { PhysicsConfig } from "@/game/physics/types";
import { CubeBuilder } from "@/game/cube/Cube";
import { RoadManager } from "@/game/road/RoadManager";

import {
  DestructionManager,
  type DestructionCell,
  type TransformationObject,
} from "../DestructionManager";
import { BaseItem } from "../items/BaseItem";
import { InteractiveItemsManager } from "../InteractiveItemsManager";
import { useCommonStore } from "@/store/commonStore";
import { usePlayerStore } from "@/store/playerStore";
import { TEXTURES } from "@/assets/textures";

type DropType =
  | "golden_coin"
  | "energon_coin"
  | "bullet"
  | "shield_booster"
  | "nitro_booster"
  | "magnet_booster";

export class CubeObstacle extends BaseObstacle {
  private visualMesh?: THREE.Object3D;
  private destructionCells: DestructionCell[] = [];
  private isDestroyed = false;
  private scene: THREE.Scene;
  private lane: number;
  private worldCollider = new THREE.Box3();
  private physicsConfig: Required<PhysicsConfig>;
  private destructionManager = DestructionManager.getInstance();
  private interactiveItemsManager = InteractiveItemsManager.getInstance();

  constructor(
    laneIndex: number,
    zPos: number,

    // lowpoly / lod visual
    formBaseConfig: GeometryConfig[],
    scene: THREE.Scene,
    useGLB = false,
    customConfig?: Partial<PhysicsConfig>,

    // detailed logical cubes
    formDetailConfig?: GeometryConfig[],
    materialConfig?: MaterialConfig,
  ) {
    super();

    this.userData.isObstacle = true;
    this.scene = scene;
    this.lane = laneIndex;
    this.physicsConfig = {
      ...useCommonStore().getBasePhysics(),
      ...customConfig,
    };

    const x = RoadManager.getInstance().getLanePosition(laneIndex);
    this.position.set(x, 0, zPos);

    const destructionSource = formDetailConfig ?? formBaseConfig;
    this.buildDestructionCells(destructionSource);
    this.buildVisual(formBaseConfig, useGLB, materialConfig);
  }

  // =========================================================
  // BUILD
  // =========================================================

  private async buildVisual(
    formConfig: GeometryConfig[],
    useGLB: boolean,
    materialConfig?: MaterialConfig,
  ) {
    const group = new THREE.Group();

    for (let i = 0; i < formConfig.length; i++) {
      const config = formConfig[i];

      if (!config) continue;

      const mesh = await CubeBuilder.build({
        index: i,
        geomConfig: config,
        useGLB,
        useTexture: true,
        materialConfig,
      });

      group.add(mesh);
    }

    this.visualMesh = group;

    const size = new THREE.Vector3();
    const box = new THREE.Box3().setFromObject(group);
    box.getSize(size);

    this.add(group);
  }

  private buildDestructionCells(configs: GeometryConfig[]) {
    this.destructionCells = configs.map((cfg) => {
      return {
        localPosition: new THREE.Vector3(cfg.pos![0], cfg.pos![1], cfg.pos![2]),
        localQuaternion: new THREE.Quaternion(),
        geomConfig: cfg,
      };
    });
  }

  public getCollider(): THREE.Box3 | null {
    if (this.isDestroyed) {
      return null;
    }

    this.worldCollider.min.set(
      this.position.x - 0.8,
      this.position.y,
      this.position.z - 0.8,
    );

    this.worldCollider.max.set(
      this.position.x + 0.8,
      this.position.y + 0.5,
      this.position.z + 0.8,
    );

    return this.worldCollider;
  }

  public update(dt: number, speed: number): boolean {
    if (this.isDestroyed) {
      return false;
    }

    const dz = dt * speed;
    this.position.z += dz;
    return this.position.z > useCommonStore().ITEMS_REMOVING_ZPOS;
  }

  // =========================================================
  // DESTROY
  // =========================================================

  public async destroy(impactPoint: THREE.Vector3, transformRequired = true) {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // remove visual lod
    if (this.visualMesh) {
      this.remove(this.visualMesh);

      this.visualMesh.traverse((obj) => {
        const mesh = obj as THREE.Mesh;

        if (mesh.geometry) {
          mesh.geometry.dispose();
        }

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose?.();
        }
      });

      this.visualMesh = undefined;
    }

    // calculate drops
    const transformations: TransformationObject[] =
      this.destructionManager.getTransformations(
        this.destructionCells,
        transformRequired,
      );

    for (let i = 0; i < this.destructionCells.length; i++) {
      const cell = this.destructionCells[i];
      const transformation = transformations[i];
      const dropType = transformation?.dropType as DropType | undefined;

      // ============================================
      // WORLD TRANSFORM
      // ============================================

      const worldPos = cell.localPosition.clone();
      this.localToWorld(worldPos);
      const worldQuat = new THREE.Quaternion()
        .copy(this.quaternion)
        .multiply(cell.localQuaternion);

      // ============================================
      // DROP
      // ============================================

      if (dropType) {
        const item = this.spawnDrop(dropType, worldPos);
        if (!item) continue;
        this.applyPhysicsToObject(item, impactPoint, worldPos);
        item.quaternion.copy(worldQuat);
        continue;
      }

      // ============================================
      // DEBRIS
      // ============================================
      const debris = new BaseItem(
        worldPos.z,
        undefined,
        worldPos.x,
        worldPos.y,
      );
      this.interactiveItemsManager.addItem(debris);

      this.scene.add(debris);
      debris.position.copy(worldPos);
      debris.quaternion.copy(worldQuat);
      this.applyPhysicsToObject(debris, impactPoint, worldPos);
      const ud = debris.userData as any;
      ud.gravity = this.physicsConfig.gravity;
      ud.life = 0;
    }

    this.destructionCells = [];
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private spawnDrop(
    dropType: DropType,
    worldPos: THREE.Vector3,
  ): BaseItem | null {
    switch (dropType) {
      case "golden_coin":
        return this.interactiveItemsManager.spawnGoldenCoin(
          worldPos.z,
          undefined,
          worldPos.x,
        );

      case "energon_coin":
        return this.interactiveItemsManager.spawnEnergonCoin(
          worldPos.z,
          undefined,
          worldPos.x,
        );

      case "bullet":
        return this.interactiveItemsManager.spawnBulletItem(
          worldPos.z,
          undefined,
          worldPos.x,
        );

      case "shield_booster":
        return this.interactiveItemsManager.spawnShieldBooster(
          worldPos.z,
          undefined,
          worldPos.x,
        );

      case "nitro_booster":
        return this.interactiveItemsManager.spawnNitroBooster(
          worldPos.z,
          undefined,
          worldPos.x,
        );

      case "magnet_booster":
        return this.interactiveItemsManager.spawnMagnetBooster(
          worldPos.z,
          undefined,
          worldPos.x,
        );

      default:
        return null;
    }
  }

  private applyPhysicsToObject(
    object: THREE.Object3D,
    impactPoint: THREE.Vector3,
    worldPos: THREE.Vector3,
  ) {
    const ud = object.userData as any;

    ud.status = "flying";

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * this.physicsConfig.explosionForce,
      Math.random() * this.physicsConfig.explosionUpward + 0.1,
      (Math.random() - 0.5) * this.physicsConfig.explosionForce,
    );

    if (impactPoint) {
      const dir = worldPos.clone().sub(impactPoint).normalize();
      dir.multiplyScalar(this.physicsConfig.explosionForce);
      velocity.add(dir);
    }

    ud.velocity = velocity;

    ud.rotationSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
      (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
      (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
    );
  }

  // =========================================================
  // GETTERS
  // =========================================================

  public getLane(): number {
    return this.lane;
  }

  public isFullyDestroyed(): boolean {
    return this.isDestroyed && this.destructionCells.length === 0;
  }
}
