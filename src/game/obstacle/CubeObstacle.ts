import * as THREE from "three";

import { BaseObstacle } from "./BaseObstacle";
import { type GeometryConfig } from "@/game/cube/types";
import { CubeBuilder } from "../cube/Cube";
import { CubePhysics } from "@/game/physics/CubePhysics";
import { ObstacleManager } from "./ObstacleManager";
import type { PhysicsConfig } from "../physics/types";
import { RoadEdge } from "@/game/road/edges/RoadEdge";
import { RoadManager } from "@/game/road/RoadManager";

export class CubeObstacle extends BaseObstacle {
  protected cubes: THREE.Object3D[] = [];
  protected isDestroyed: boolean = false;
  private physicsConfig: Required<PhysicsConfig>;
  private scene: THREE.Scene;

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
      explosionForce: 0.2,
      explosionUpward: 0.8,
      cubeRotationSpeed: 0.01,
      ...customConfig,
    };

    const x = RoadManager.getInstance().getLanePosition(laneIndex);
    this.position.set(x, 0, zPos);

    this.build(formConfig, useGLB);
  }

  public update(dt: number, speed: number): boolean {
    if (!this.isDestroyed) {
      this.updateNormalCubes(dt, speed);
      return this.position.z > 10;
    } else {
      this.updateDestroyedCubes();
      return this.cubes.length === 0;
    }
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
        });
        this.add(cube);
        cubes.push(cube);
      }
    }

    this.cubes = cubes;
  }
  public destroy(impactPoint?: THREE.Vector3) {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Отсоединяем кубики от группы и добавляем в сцену
    this.cubes.forEach((cube) => {
      const worldPos = cube.getWorldPosition(new THREE.Vector3());
      const worldRot = cube.getWorldQuaternion(new THREE.Quaternion());
      this.remove(cube);
      this.scene.add(cube);
      cube.position.copy(worldPos);
      cube.quaternion.copy(worldRot);
      const ud = cube.userData as any;
      ud.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * this.physicsConfig.explosionForce,
        Math.random() * this.physicsConfig.explosionUpward + 0.1,
        (Math.random() - 0.5) * this.physicsConfig.explosionForce,
      );
      if (impactPoint) {
        const dir = cube.position.clone().sub(impactPoint).normalize();
        ud.velocity.copy(dir.multiplyScalar(this.physicsConfig.explosionForce));
      }
      ud.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
      );
    });

    // Регистрируем кубики в менеджере для последующей очистки при reset
    ObstacleManager.getInstance().registerDestroyedCubes(this.cubes);
  }
  protected updateDestroyedCubes() {
    const edges = RoadManager.getInstance()
      .getEdges()
      .filter((e) => e instanceof RoadEdge) as RoadEdge[];

    CubePhysics.updateCubes(this.cubes, this.physicsConfig, edges, (cube) => {
      this.scene.remove(cube);
    });
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
    // box.expandByScalar(2);
    // console.log(
    //   `[CubeObstacle] getCollider for ${this.constructor.name}:`,
    //   box,
    //   "cubes count:",
    //   this.cubes.length,
    // );
    return box;
  }
  public getCubes(): THREE.Object3D[] {
    return this.cubes;
  }
  public isFullyDestroyed(): boolean {
    return this.isDestroyed && this.cubes.length === 0;
  }
}
