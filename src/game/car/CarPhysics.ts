// src/game/car/CarPhysics

import * as THREE from "three";
import { type CarConfig } from "./types";
import { DEFAULT_CAR_CONFIG } from "./config";
import { RoadManager } from "../road/RoadManager";
import { RoadEdge } from "../road/edges/RoadEdge";
import { JumpSimulator, type JumpState } from "./JumpSimulator";
import { CubePhysics } from "@/game/physics/CubePhysics";
import type { PhysicsConfig } from "../physics/types";

export class CarPhysics {
  private config: Required<CarConfig>;
  private jumpSimulator: JumpSimulator;
  private jumpState: JumpState;
  private physicsConfig: Required<PhysicsConfig> = {
    gravity: 0.01,
    bounceFactor: 0.4,
    friction: 0.85,
    collisionFactor: 0.2,
    removalHeight: -10,
    explosionForce: 0.2,
    explosionUpward: 0.8,
    cubeRotationSpeed: 0.05,
  };

  constructor(config: Partial<CarConfig> = {}) {
    this.config = { ...DEFAULT_CAR_CONFIG, ...config };
    this.jumpSimulator = new JumpSimulator({
      gravity: this.config.gravity,
      jumpHeight: this.config.jumpHeight,
      groundY: 0.8,
    });

    this.jumpState = this.jumpSimulator.createInitialState();
  }

  public startJump(currentY: number): void {
    this.jumpSimulator.setGroundY(currentY);
    this.jumpState = this.jumpSimulator.startJump({
      ...this.jumpState,
      y: currentY,
    });
  }

  public updateJump(currentY: number): {
    newY: number;
    isJumping: boolean;
    pitch: number;
  } {
    // Если прыжок не активен – просто возвращаем текущую высоту,
    // а внутреннее состояние подгоняем под неё (для корректного старта в будущем)
    if (!this.jumpState.isJumping) {
      this.jumpState.y = currentY;
      return {
        newY: currentY,
        isJumping: false,
        pitch: 0,
      };
    }

    // Активная фаза прыжка – используем симуляцию
    const prevVelocity = this.jumpState.velocity;
    this.jumpState = this.jumpSimulator.step(this.jumpState);
    const pitch = prevVelocity > 0 ? 0.2 : -0.1;
    return {
      newY: this.jumpState.y,
      isJumping: this.jumpState.isJumping,
      pitch,
    };
  }

  public updateLaneMovement(
    currentX: number,
    targetX: number,
    currentRotationY: number,
  ): { newX: number; newRotationY: number } {
    const deltaX = targetX - currentX;

    if (isNaN(deltaX)) {
      return { newX: currentX, newRotationY: currentRotationY };
    }

    const newX = currentX + deltaX * this.config.laneChangeSpeed;
    const newRotationY =
      currentRotationY +
      (-deltaX * this.config.maxTilt - currentRotationY) *
        this.config.tiltSmoothing;

    return { newX, newRotationY };
  }

  public createExplosionCubes(
    cubes: THREE.Object3D[],
    car: THREE.Group,
    scene: THREE.Scene,
    impactPoint: THREE.Vector3 | null = null,
  ): void {
    cubes.forEach((cube) => {
      const worldPos = cube.getWorldPosition(new THREE.Vector3());
      const worldRot = cube.getWorldQuaternion(new THREE.Quaternion());

      car.remove(cube);
      scene.add(cube);

      cube.position.copy(worldPos);
      cube.quaternion.copy(worldRot);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * this.config.explosionForce,
        Math.random() * this.config.explosionUpward + 0.1,
        (Math.random() - 0.5) * this.config.explosionForce,
      );

      if (impactPoint) {
        const dir = cube.position.clone().sub(impactPoint).normalize();
        velocity.copy(dir.multiplyScalar(this.config.explosionForce));
      }

      const userData = cube.userData as any;
      userData.velocity = velocity;
      userData.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * this.config.cubeRotationSpeed,
        (Math.random() - 0.5) * this.config.cubeRotationSpeed,
        (Math.random() - 0.5) * this.config.cubeRotationSpeed,
      );
    });
  }

  public updateDestroyedCubes(
    cubes: THREE.Object3D[],
    scene: THREE.Scene,
  ): void {
    const edges = RoadManager.getInstance()
      .getEdges()
      .filter((e) => e instanceof RoadEdge) as RoadEdge[];

    CubePhysics.updateCubes(cubes, this.physicsConfig, edges, (cube) => {
      // удаляем куб из сцены
      scene.remove(cube);
    });
  }

  public reset(): void {
    this.jumpState = this.jumpSimulator.createInitialState();
  }

  public getState() {
    return {
      isJumping: this.jumpState.isJumping,
      jumpVelocity: this.jumpState.velocity,
      targetPitch: this.jumpState.isJumping
        ? this.jumpState.velocity > 0
          ? 0.2
          : -0.1
        : 0,
    };
  }
}
