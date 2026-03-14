import * as THREE from "three";

import { BaseObstacle } from "./BaseObstacle";
import type { GeometryConfig } from "@/game/cube/types";
import type { PhysicsConfig } from "@/game/physics/types";
import { CubeBuilder } from "@/game/cube/Cube";
// import { CubePhysics } from "@/game/physics/CubePhysics";
// import { RoadEdge } from "@/game/road/edges/RoadEdge";
import { RoadManager } from "@/game/road/RoadManager";
// import { ObstacleManager } from "./ObstacleManager";
import { CAR_MATERIAL_CONFIG } from "@/game/car";
import { DestructionManager } from "../DestructionManager";

export class CubeObstacle extends BaseObstacle {
  protected cubes: THREE.Object3D[] = [];
  protected isDestroyed: boolean = false;
  private physicsConfig: Required<PhysicsConfig>;
  private scene: THREE.Scene;
  private lane: number;

  constructor(
    laneIndex: number,
    zPos: number,
    formConfig: GeometryConfig[],
    scene: THREE.Scene,
    useGLB = false,
    customConfig?: Partial<PhysicsConfig>,
  ) {
    super();
    this.scene = scene;
    this.physicsConfig = {
      gravity: 0.01,
      bounceFactor: 0.4,
      friction: 0.85,
      collisionFactor: 0.2,
      removalHeight: -10,
      explosionForce: 0.1,
      explosionUpward: 0.1,
      cubeRotationSpeed: 1,
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
      return this.position.z > 10;
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

  // public destroy(impactPoint?: THREE.Vector3) {
  //   if (this.isDestroyed) return;
  //   this.isDestroyed = true;

  //   // Отсоединяем кубики от группы и добавляем в сцену
  //   this.cubes.forEach((cube) => {
  //     const worldPos = cube.getWorldPosition(new THREE.Vector3());
  //     const worldRot = cube.getWorldQuaternion(new THREE.Quaternion());
  //     this.remove(cube);
  //     this.scene.add(cube);
  //     cube.position.copy(worldPos);
  //     cube.quaternion.copy(worldRot);
  //     const ud = cube.userData as any;
  //     ud.velocity = new THREE.Vector3(
  //       (Math.random() - 0.5) * this.physicsConfig.explosionForce,
  //       Math.random() * this.physicsConfig.explosionUpward + 0.1,
  //       (Math.random() - 0.5) * this.physicsConfig.explosionForce,
  //     );
  //     if (impactPoint) {
  //       const dir = cube.position.clone().sub(impactPoint).normalize();
  //       ud.velocity.copy(dir.multiplyScalar(this.physicsConfig.explosionForce));
  //     }
  //     ud.rotationSpeed = new THREE.Vector3(
  //       (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
  //       (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
  //       (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
  //     );
  //   });

  //   // Регистрируем кубики в менеджере для последующей очистки при reset
  //   DestructionManager.getInstance().registerCubes(this.cubes);
  // }
  public destroy(impactPoint?: THREE.Vector3) {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    const dm = DestructionManager.getInstance();

    this.cubes.forEach((cube) => {
      // Получаем мировые координаты
      const worldPos = cube.getWorldPosition(new THREE.Vector3());
      const worldRot = cube.getWorldQuaternion(new THREE.Quaternion());

      // Отсоединяем от группы и добавляем в сцену
      this.remove(cube);
      this.scene.add(cube);
      cube.position.copy(worldPos);
      cube.quaternion.copy(worldRot);

      const ud = cube.userData as any;

      // --- Вектор скорости с комбинированным разбросом ---
      const baseVel = new THREE.Vector3(
        (Math.random() - 0.5) * this.physicsConfig.explosionForce,
        Math.random() * this.physicsConfig.explosionUpward + 0.1,
        (Math.random() - 0.5) * this.physicsConfig.explosionForce,
      );

      if (impactPoint) {
        const dir = cube.position.clone().sub(impactPoint).normalize();
        dir.multiplyScalar(this.physicsConfig.explosionForce);
        baseVel.add(dir); // суммируем случайный и направленный вектор
      }

      ud.velocity = baseVel;

      // --- Вращение ---
      ud.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
      );

      // --- Дополнительные данные для DestructionManager ---
      ud.gravity = this.physicsConfig.gravity; // можно использовать в update
      ud.life = 0; // для задержки приземления, если нужно
    });

    // Регистрируем кубики в DestructionManager
    dm.registerCubes(this.cubes);
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
