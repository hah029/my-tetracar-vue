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

    CubePhysics.updateCubes(this.cubes, this.physicsConfig, edges, (cube) => {
      this.scene.remove(cube);
    });

    // движение дороги
    const dtSec = dt / 1000;

    for (let i = this.cubes.length - 1; i >= 0; i--) {
      const cube = this.cubes[i]!;

      cube.position.z += speed * dtSec;

      if (cube.position.z > 10) {
        this.scene.remove(cube);
        this.cubes.splice(i, 1);
        continue;
      }

      this.tryLandCube(cube, i);
    }
  }

  private tryLandCube(cube: THREE.Object3D, index: number) {
    const ud = cube.userData;
    const v: THREE.Vector3 = ud.velocity;

    if (ud.state !== "flying") return;

    if (!v) return;

    const slowEnough = v.lengthSq() < 0.5;
    const nearGround = cube.position.y <= 0.2;

    if (!slowEnough || !nearGround) return;

    ud.state = "landed";

    const road = RoadManager.getInstance();
    const lane = road.getClosestLaneIndex(cube.position.x);

    cube.position.x = road.getLanePosition(lane);
    cube.position.y = 0;

    this.spawnDrop(ud.dropType, lane, cube.position.z);

    this.scene.remove(cube);
    this.cubes.splice(index, 1);
  }

  private spawnDrop(
    drop: "coin" | "booster" | "bullet" | null,
    lane: number,
    z: number,
  ) {
    if (!drop) return;

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
  }

  private rollDrop(): "coin" | "booster" | "bullet" | null {
    const r = Math.random();

    if (r < 0.95) return null;
    if (r < 0.98) return "coin";
    if (r < 0.99) return "bullet";
    return "booster";
  }

  public reset() {
    this.cubes.forEach((c) => this.scene.remove(c));
    this.cubes = [];
  }
}
