import * as THREE from "three";

import { BaseObstacle } from "./BaseObstacle";
import type { GeometryConfig } from "@/game/cube/types";
import type { PhysicsConfig } from "@/game/physics/types";
import { CubeBuilder } from "@/game/cube/Cube";
import { RoadManager } from "@/game/road/RoadManager";
import { CAR_MATERIAL_CONFIG } from "@/game/car";
import { DestructionManager } from "../DestructionManager";
import { useCommonStore } from "@/store/commonStore";
import { InteractiveItemsManager } from "../InteractiveItemsManager";
import type { BaseItem } from "../items/BaseItem";

export class CubeObstacle extends BaseObstacle {
  protected cubes: THREE.Object3D[] = [];
  protected isDestroyed: boolean = false;
  private physicsConfig: Required<PhysicsConfig>;
  private scene: THREE.Scene;
  private lane: number;

  private interactiveItemsManager = InteractiveItemsManager.getInstance();
  private destructionManager = DestructionManager.getInstance();

  constructor(
    laneIndex: number,
    zPos: number,
    formConfig: GeometryConfig[],
    scene: THREE.Scene,
    useGLB = false,
    customConfig?: Partial<PhysicsConfig>,
  ) {
    super();
    this.userData.isObstacle = true;
    this.scene = scene;
    this.physicsConfig = {
      ...useCommonStore().getBasePhysics(),
      ...customConfig,
    };

    const x = RoadManager.getInstance().getLanePosition(laneIndex);
    this.lane = laneIndex;
    this.position.set(x, 0, zPos);

    this.build(formConfig, useGLB);
  }

  public update(dt: number, speed: number): boolean {
    if (!this.isDestroyed) {
      this.updateNormalCubes(dt, speed);
      return this.position.z > useCommonStore().ITEMS_REMOVING_ZPOS;
    }
    return false;
  }

  async build(formConfig: GeometryConfig[], useGLB: boolean): Promise<void> {
    const cubes: THREE.Object3D[] = [];

    for (let i = 0; i < formConfig.length; i++) {
      const config = formConfig[i];
      if (config != undefined) {
        const cube = await CubeBuilder.build({
          index: i,
          geomConfig: config,
          useGLB: useGLB,
          useTexture: true,
          materialConfig: CAR_MATERIAL_CONFIG,
        });
        this.add(cube);
        cubes.push(cube);
      }
    }

    this.cubes = cubes;
  }

  // public destroy(
  //   impactPoint: THREE.Vector3,
  //   transformRequired: boolean = true,
  // ) {
  //   if (this.isDestroyed) return;
  //   this.isDestroyed = true;

  //   this.cubes.forEach((cube, idx) => {
  //     // Получаем мировые координаты
  //     const worldPos = cube.getWorldPosition(new THREE.Vector3());
  //     const worldRot = cube.getWorldQuaternion(new THREE.Quaternion());

  //     // Отсоединяем от группы и добавляем в сцену
  //     this.remove(cube);
  //     this.scene.add(cube);
  //     cube.position.copy(worldPos);
  //     cube.quaternion.copy(worldRot);

  //     const ud = cube.userData as any;

  //     // --- Вектор скорости с комбинированным разбросом ---
  //     const baseVel = new THREE.Vector3(
  //       (Math.random() - 0.5) * this.physicsConfig.explosionForce,
  //       Math.random() * this.physicsConfig.explosionUpward + 0.1,
  //       (Math.random() - 0.5) * this.physicsConfig.explosionForce,
  //     );

  //     if (impactPoint) {
  //       const dir = cube.position.clone().sub(impactPoint).normalize();
  //       dir.multiplyScalar(this.physicsConfig.explosionForce);
  //       baseVel.add(dir); // суммируем случайный и направленный вектор
  //     }

  //     ud.velocity = baseVel;

  //     // --- Вращение ---
  //     ud.rotationSpeed = new THREE.Vector3(
  //       (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
  //       (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
  //       (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
  //     );

  //     // --- Дополнительные данные для DestructionManager ---
  //     ud.gravity = this.physicsConfig.gravity; // можно использовать в update
  //     ud.life = 0; // для задержки приземления, если нужно
  //   });

  //   // Регистрируем кубики в DestructionManager
  //   let cubesTransformations = this.destructionManager.getTransformations(
  //     this.cubes,
  //     transformRequired,
  //   );
  //   this.interactiveItemsManager.transformDestroyedCubes(cubesTransformations);
  // }
  // CubeObstacle.destroy
  public destroy(
    impactPoint: THREE.Vector3,
    transformRequired: boolean = true,
  ) {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Получаем для каждого куба, во что он превратится
    const dropTypes: any[] = this.destructionManager.getTransformations(
      this.cubes,
      transformRequired,
    );

    for (let i = 0; i < this.cubes.length; i++) {
      const cube = this.cubes[i];
      const dropType = dropTypes[i]?.dropType;

      // Получаем мировую позицию и вращение куба
      const worldPos = cube.getWorldPosition(new THREE.Vector3());
      const worldQuat = cube.getWorldQuaternion(new THREE.Quaternion());

      // Создаём соответствующий предмет (монету или бустер)
      let item: BaseItem | null = null;
      switch (dropType) {
        case "golden_coin":
          item = this.interactiveItemsManager.spawnGoldenCoin(
            worldPos.z,
            undefined,
            worldPos.x,
          );
          break;
        case "energon_coin":
          item = this.interactiveItemsManager.spawnEnergonCoin(
            worldPos.z,
            undefined,
            worldPos.x,
          );
          break;
        case "bullet":
          item = this.interactiveItemsManager.spawnBulletItem(
            worldPos.z,
            undefined,
            worldPos.x,
          );
          break;
        case "shield_booster":
          item = this.interactiveItemsManager.spawnShieldBooster(
            worldPos.z,
            undefined,
            worldPos.x,
          );
          break;
        case "nitro_booster":
          item = this.interactiveItemsManager.spawnNitroBooster(
            worldPos.z,
            undefined,
            worldPos.x,
          );
          break;
        case "magnet_booster":
          item = this.interactiveItemsManager.spawnMagnetBooster(
            worldPos.z,
            undefined,
            worldPos.x,
          );
          break;
        default:
          // Если дроп не выпал – не создаём ничего (или можно создать базовую монету)
          continue;
      }

      if (!item) continue;

      // Устанавливаем flying-статус и физические параметры, скопированные от куба
      item.userData.status = "flying";
      item.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * this.physicsConfig.explosionForce,
        Math.random() * this.physicsConfig.explosionUpward + 0.1,
        (Math.random() - 0.5) * this.physicsConfig.explosionForce,
      );
      if (impactPoint) {
        const dir = worldPos.clone().sub(impactPoint).normalize();
        dir.multiplyScalar(this.physicsConfig.explosionForce);
        item.userData.velocity.add(dir);
      }

      item.userData.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
      );

      // Синхронизируем позицию и вращение (предмет может быть уже в нужном месте, но для верности)
      item.position.copy(worldPos);
      item.quaternion.copy(worldQuat);

      // Добавляем в сцену и в менеджер (уже сделано внутри spawn-методов, но проверим)
      // Удаляем исходный куб из группы и сцены
      this.remove(cube);
      this.scene.remove(cube);
    }

    // Очищаем массив кубов, чтобы они больше не участвовали в коллизиях
    this.cubes = [];
  }

  protected updateNormalCubes(dt: number, speed: number) {
    this.position.z += dt * speed;
  }

  public getCollider(): THREE.Box3 | null {
    if (this.isDestroyed) return null;
    const box = new THREE.Box3();
    for (const cube of this.cubes) {
      box.expandByObject(cube);
    }
    return box;
  }

  public getCubes(): THREE.Object3D[] {
    return this.cubes;
  }

  public getLane(): number {
    return this.lane;
  }

  public isFullyDestroyed(): boolean {
    return this.isDestroyed && this.cubes.length === 0;
  }
}
