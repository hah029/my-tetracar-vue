import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";
import { InteractiveItemsManager } from "@/game/interactive/InteractiveItemsManager";
import {
  CubePhysics,
  type CubePhysicsConfig,
} from "@/game/physics/CubePhysics";
import { RoadEdge } from "@/game/road/edges";
import { loadTexture } from "@/helpers/loaders";

import cube_gold from "@/assets/textures/cube_gold.svg";
import cube_diamond from "@/assets/textures/cube_diamond.svg";
import cube_nitro from "@/assets/textures/cube_nitro.svg";
import cube_armor from "@/assets/textures/cube_armor.svg";
import cube_bullet from "@/assets/textures/cube_bullet.svg";

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

  private transformMapping: {
    [K in
      | "gold_coin"
      | "diamond_coin"
      | "nitro_booster"
      | "shield_booster"
      | "bullet"]: (lane: number, z: number) => void;
  } = {
    gold_coin: (lane, z) => this.interactiveItemsManager.spawnGoldCoin(lane, z),
    diamond_coin: (lane, z) =>
      this.interactiveItemsManager.spawnDiamondCoin(lane, z),
    nitro_booster: (lane, z) =>
      this.interactiveItemsManager.spawnNitroBooster(lane, z),
    shield_booster: (lane, z) =>
      this.interactiveItemsManager.spawnShieldBooster(lane, z),
    bullet: (lane, z) => this.interactiveItemsManager.spawnBulletItem(lane, z),
  };

  private textureMapping: {
    [K in
      | "gold_coin"
      | "diamond_coin"
      | "nitro_booster"
      | "shield_booster"
      | "bullet"]: string;
  } = {
    gold_coin: cube_gold,
    diamond_coin: cube_diamond,
    nitro_booster: cube_nitro,
    shield_booster: cube_armor,
    bullet: cube_bullet,
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
      if (drop) {
        const texture = loadTexture(this.textureMapping[drop]);
        texture.flipY = false;
        cube.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,
            });
          }
        });
      }

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
    drop: keyof typeof this.transformMapping | null,
    lane: number,
    z: number,
  ): boolean {
    if (!drop) return false;

    const spawner = this.transformMapping[drop];
    if (spawner) {
      spawner(lane, z);
      return true;
    }
    return false;
  }

  private rollDrop(): keyof typeof this.transformMapping | null {
    const dropTypes = Object.keys(
      this.transformMapping,
    ) as (keyof typeof this.transformMapping)[];
    const choices: (keyof typeof this.transformMapping | null)[] = [
      ...dropTypes,
      null,
    ];
    const weights = [...dropTypes.map(() => 1), 1]; // пример: все веса = 1

    let totalWeight = 0;
    const cumulativeWeights = weights.map((w) => (totalWeight += w));
    const random = Math.random() * totalWeight;
    const index = cumulativeWeights.findIndex((cw) => cw > random);
    return choices[index]!;
  }

  public reset() {
    this.cubes.forEach((c) => this.scene.remove(c));
    this.cubes = [];
  }
}
