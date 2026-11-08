import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BaseObstacle } from "./BaseObstacle";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import type { PhysicsConfig } from "@/game/physics/types";
import { CubeBuilder } from "@/game/cube/Cube";
import { loadCubeModel } from "@/game/cube/loadCube";
import { RoadManager } from "@/game/environment/road";
import { OBSTACLE_ATLAS_SPRITES } from "@/assets/textures/atlasSprites";
import { applyAtlasSpriteUV } from "@/helpers/applyAtlasUV";
import { MaterialPool } from "@/helpers/MaterialPool";  // 👈 ДОБАВИТЬ ИМПОРТ
import { atlas } from "@/assets/textures/TextureAtlas";  // 👈 ДОБАВИТЬ ИМПОРТ

import {
  DestructionManager,
  type DestructionCell,
  type TransformationObject,
} from "../DestructionManager";
import { BaseItem } from "../items/BaseItem";
import { InteractiveItemsManager } from "../InteractiveItemsManager";
import { useCommonStore } from "@/store/commonStore";
import type { CurvedItemState } from "../items/BaseItem";

type DropType =
  | "golden_coin"
  | "energon_coin"
  | "bullet"
  | "shield_booster"
  | "nitro_booster"
  | "magnet_booster";

export class CubeObstacle extends BaseObstacle {
  private static mergedAtlasGeometryCache = new Map<string, THREE.BufferGeometry>();
  // ❌ Удаляем старый кэш материалов
  // private static atlasMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

  private visualMesh?: THREE.Object3D;
  private destructionCells: DestructionCell[] = [];
  protected isDestroyed = false;
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
    this.position.set(x, this.getSurfaceY(laneIndex, zPos), zPos);

    const destructionSource = formDetailConfig ?? formBaseConfig;
    this.buildDestructionCells(destructionSource);
    this.buildVisual(formBaseConfig, useGLB, materialConfig, formDetailConfig);
  }

  // =========================================================
  // BUILD
  // =========================================================

  private async buildVisual(
    formConfig: GeometryConfig[],
    useGLB: boolean,
    materialConfig?: MaterialConfig,
    formDetailConfig?: GeometryConfig[],
) {
    // 👇 СОЗДАЁМ МАТЕРИАЛ ЧЕРЕЗ MaterialPool ЕСЛИ ЕСТЬ АТЛАС
    let sharedMaterial: THREE.Material | null = null;
    if (materialConfig?.atlas && materialConfig?.atlasSprite) {
        sharedMaterial = MaterialPool.getMaterial({
            type: 'atlas',
            key: `obstacle_${materialConfig.atlasSprite}`,
            atlasSprite: materialConfig.atlasSprite,
            color: materialConfig.color ?? 0xffffff,
            emissive: materialConfig.emissive ?? 0x000000,
            emissiveIntensity: materialConfig.emissiveIntensity ?? 1,
            transparent: true,
        });
    }

    const group = new THREE.Group();

    for (let i = 0; i < formConfig.length; i++) {
        const config = formConfig[i];
        if (!config) continue;

        const mesh = await CubeBuilder.build({
            index: i,
            geomConfig: config,
            useGLB: true,
            useTexture: true,
            existingMaterial: sharedMaterial ?? undefined,
            materialConfig,
        });

        group.add(mesh);
    }

    // `CubeBuilder.build` асинхронен: столкновение может уничтожить объект,
    // пока его модель ещё загружается. Не добавляем поздно собранную модель
    // обратно в уже разрушенное препятствие.
    if (this.isDestroyed) {
      group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry && !mesh.userData.sharedObstacleResources) {
          mesh.geometry.dispose();
        }
        if (mesh.userData.sharedObstacleResources) return;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else {
          mesh.material?.dispose?.();
        }
      });
      return;
    }

    this.visualMesh = group;
    this.add(group);
}

  private async buildMergedAtlasVisual(
    formConfig: GeometryConfig[],
    useGLB: boolean,
    materialConfig?: MaterialConfig,
  ): Promise<THREE.Mesh | null> {
    if (
      !useGLB ||
      !formConfig.length ||
      !materialConfig?.atlas ||
      materialConfig.atlasSprite !== OBSTACLE_ATLAS_SPRITES.default
    ) {
      return null;
    }

    const atlasTexture = materialConfig.atlas.getAtlasTexture();
    if (!atlasTexture) return null;

    const geometry = await this.getMergedAtlasGeometry(formConfig, materialConfig);
    if (!geometry) return null;

    // ✅ ИСПОЛЬЗУЕМ MaterialPool ВМЕСТО ЛОКАЛЬНОГО КЭША
    const material = this.getSharedAtlasMaterial(materialConfig);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.sharedObstacleResources = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private async getMergedAtlasGeometry(
    formConfig: GeometryConfig[],
    materialConfig: MaterialConfig,
  ): Promise<THREE.BufferGeometry | null> {
    const cacheKey = JSON.stringify({
      atlasSprite: materialConfig.atlasSprite,
      form: formConfig.map((config) => ({
        modelUrl: config.modelUrl,
        pos: config.pos ?? [0, 0, 0],
        scale: config.scale,
      })),
    });

    const cached = CubeObstacle.mergedAtlasGeometryCache.get(cacheKey);
    if (cached) return cached;

    const sprite = materialConfig.atlas?.getSprite(materialConfig.atlasSprite!);
    if (!sprite) return null;

    const geometries: THREE.BufferGeometry[] = [];

    for (const config of formConfig) {
      if (!config.modelUrl) {
        geometries.forEach((geometry) => geometry.dispose());
        return null;
      }

      const model = await loadCubeModel(config.modelUrl);
      model.updateMatrixWorld(true);

      const pos = config.pos ?? [0, 0, 0];
      const rootMatrix = new THREE.Matrix4()
        .makeScale(config.scale[0], config.scale[1], config.scale[2])
        .setPosition(pos[0], pos[1], pos[2]);

      model.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;

        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry.clone();
        applyAtlasSpriteUV(geometry, sprite);
        geometry.applyMatrix4(mesh.matrixWorld);
        geometry.applyMatrix4(rootMatrix);
        geometries.push(geometry);
      });
    }

    if (geometries.length === 0) return null;

    const mergedGeometry = mergeGeometries(geometries, false);
    geometries.forEach((geometry) => geometry.dispose());
    if (!mergedGeometry) return null;

    CubeObstacle.mergedAtlasGeometryCache.set(cacheKey, mergedGeometry);
    return mergedGeometry;
  }

  // ✅ НОВЫЙ МЕТОД — использует MaterialPool вместо локального кэша
  private getSharedAtlasMaterial(
    materialConfig: MaterialConfig,
  ): THREE.MeshStandardMaterial {
    const cacheKey = JSON.stringify({
      atlasSprite: materialConfig.atlasSprite,
      color: materialConfig.color ?? 0xffffff,
      emissive: materialConfig.emissive ?? 0x000000,
      emissiveIntensity: materialConfig.emissiveIntensity ?? 1,
    });

    // Используем MaterialPool
    const material = MaterialPool.getMaterial({
      type: 'atlas',
      key: `obstacle_${cacheKey}`,
      atlasSprite: materialConfig.atlasSprite,
      color: materialConfig.color ?? 0xffffff,
      emissive: materialConfig.emissive ?? 0x000000,
      emissiveIntensity: materialConfig.emissiveIntensity ?? 1,
      transparent: true,
    }) as THREE.MeshStandardMaterial;

    return material;
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
      return true;
    }

    const curvedState = this.userData.curvedItemState as
      | CurvedItemState
      | undefined;
    if (curvedState) {
      const angleSign = curvedState.direction === "left" ? 1 : -1;
      const angle = angleSign * curvedState.motion.angleRad;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      this.position.x =
        curvedState.pivotX +
        curvedState.localPx * cos +
        curvedState.localPz * sin;
      this.position.z =
        curvedState.motion.pivotZ +
        curvedState.localPz * cos -
        curvedState.localPx * sin;
      this.rotation.y = angle + curvedState.localAngleRad;
      if (curvedState.motion.completed) {
        delete this.userData.curvedItemState;
      }
    } else {
      this.position.z += dt * speed;
    }
    this.position.y = this.getSurfaceY(this.getLane(), this.position.z);
    return this.position.z > useCommonStore().config.itemsRemovingZpos;
  }

  public setCurvedItemState(state: CurvedItemState | undefined): void {
    if (!state) return;
    this.userData.curvedItemState = state;
  }

  protected getSurfaceY(laneIndex: number, z: number): number {
    return RoadManager.getInstance().getSurfaceHeightAt(laneIndex, z);
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

        if (mesh.geometry && !mesh.userData.sharedObstacleResources) {
          mesh.geometry.dispose();
        }

        if (mesh.userData.sharedObstacleResources) {
          return;
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
          "drop",
        );

      case "energon_coin":
        return this.interactiveItemsManager.spawnEnergonCoin(
          worldPos.z,
          undefined,
          worldPos.x,
          "drop",
        );

      case "bullet":
        return this.interactiveItemsManager.spawnBulletItem(
          worldPos.z,
          undefined,
          worldPos.x,
          "drop",
        );

      case "shield_booster":
        return this.interactiveItemsManager.spawnShieldBooster(
          worldPos.z,
          undefined,
          worldPos.x,
          "drop",
        );

      case "nitro_booster":
        return this.interactiveItemsManager.spawnNitroBooster(
          worldPos.z,
          undefined,
          worldPos.x,
          "drop",
        );

      case "magnet_booster":
        return this.interactiveItemsManager.spawnMagnetBooster(
          worldPos.z,
          undefined,
          worldPos.x,
          "drop",
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

    // Фрагменты и дропы создаются при разрушении вне исходного obstacle.
    // Эта метка нужна для гарантированной очистки сцены при reset игры.
    ud.isDestructionFragment = true;
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
