import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";
import { InteractiveItemsManager } from "@/game/interactive/InteractiveItemsManager";
import {
  CubePhysics,
  type CubePhysicsConfig,
} from "@/game/physics/CubePhysics";
import { RoadEdge } from "@/game/road/edges";

export class DestructionManager {
  private static instance: DestructionManager | null = null;
  private cubes: THREE.Object3D[] = [];
  private scene!: THREE.Scene;
  private interactiveItemsManager!: InteractiveItemsManager;
  private physicsConfig: CubePhysicsConfig = {
    bounceFactor: 0.4,
    collisionFactor: 0.2,
    friction: 0.85,
    gravity: 0.01,
    removalHeight: -10,
  };

  public static getInstance(): DestructionManager {
    if (!DestructionManager.instance) {
      DestructionManager.instance = new DestructionManager();
    }
    return DestructionManager.instance;
  }

  public initialize(scene: THREE.Scene, itemsManager: InteractiveItemsManager) {
    this.scene = scene;
    this.interactiveItemsManager = itemsManager;
  }

  public registerCubes(cubes: THREE.Object3D[]) {
    cubes.forEach((cube) => {
      const drop = this.rollDrop();

      cube.userData.dropType = drop;
      cube.userData.state = "flying";
    });

    this.cubes.push(...cubes);
  }

  public update(dt: number, speed: number) {
    const edges = RoadManager.getInstance()
      .getEdges()
      .filter((e) => e instanceof RoadEdge) as RoadEdge[];

    const removed: THREE.Object3D[] = [];

    const flyingCubes = this.cubes.filter((c) => c.userData.state === "flying");

    CubePhysics.updateCubes(flyingCubes, this.physicsConfig, edges, (cube) => {
      removed.push(cube);
    });

    // удаляем только после физики
    for (const cube of removed) {
      const index = this.cubes.indexOf(cube);
      if (index !== -1) {
        this.scene.remove(cube);
        this.cubes.splice(index, 1);
      }
    }

    for (let i = this.cubes.length - 1; i >= 0; i--) {
      const cube = this.cubes[i]!;

      cube.position.z += speed * dt;

      if (cube.position.z > 10) {
        this.scene.remove(cube);
        this.cubes.splice(i, 1);
        continue;
      }

      this.tryLandCube(cube);
    }
  }

  private tryLandCube(cube: THREE.Object3D) {
    const ud = cube.userData;
    const v: THREE.Vector3 = ud.velocity;

    if (ud.state !== "flying") {
      return;
    }
    if (!v) {
      return;
    }

    const slowEnough = v.lengthSq() < 0.5;
    const nearGround = cube.position.y <= 0.2;

    if (!slowEnough || !nearGround) return;

    ud.state = "landed";

    const road = RoadManager.getInstance();
    const lane = road.getClosestLaneIndex(cube.position.x);

    cube.position.x = road.getLanePosition(lane);
    cube.position.y = 0;

    // останавливаем физику
    ud.velocity.set(0, 0, 0);
    ud.rotationSpeed?.set(0, 0, 0);

    const spawned = this.spawnDrop(ud.dropType, lane, cube.position.z);

    // если дропа нет — делаем кубик прозрачным
    if (!spawned) {
      cube.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.Material & {
            opacity?: number;
            transparent?: boolean;
            emissiveIntensity?: number;
          };

          mat.opacity = 0.1;
          mat.emissiveIntensity = 0;
        }
      });
    } else {
      // если был дроп — удаляем куб
      this.scene.remove(cube);
      const index = this.cubes.indexOf(cube);
      if (index !== -1) this.cubes.splice(index, 1);
    }
  }

  private spawnDrop(
    drop: "coin" | "booster" | "bullet" | null,
    lane: number,
    z: number,
  ): boolean {
    if (!drop) return false;

    switch (drop) {
      case "coin":
        this.interactiveItemsManager.spawnSingleCoin(lane, z);
        break;

      case "booster":
        this.interactiveItemsManager.spawnBooster(lane, z);
        break;

      case "bullet":
        this.interactiveItemsManager.spawnBulletItem(lane, z);
        break;
    }

    return true;
  }

  private rollDrop() {
    const choices = ["coin", "booster", "bullet", null];
    const weights: number[] = [1, 1, 1, 1];

    let i;
    for (i = 1; i < weights.length; i++) weights[i]! += weights[i - 1]!;
    var random = Math.random() * weights[weights.length - 1]!;
    for (i = 0; i < weights.length; i++) if (weights[i]! > random) break;

    return choices[i];
  }

  public reset() {
    this.cubes.forEach((c) => this.scene.remove(c));
    this.cubes = [];
  }
}
