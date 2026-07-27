// src/game/car/CarPhysics

import * as THREE from "three";
import { RoadManager } from "@/game/environment/road";
import { RoadEdge } from "@/game/environment/road/edges/RoadEdge";
import {
  CubePhysics,
  type CubePhysicsConfig,
} from "@/game/physics/CubePhysics";
import { useCommonStore } from "@/store/commonStore";
import { usePlayerStore } from "@/store/playerStore";
import type { CarConfig } from ".";
import { JumpSimulator, type JumpState } from "../physics/JumpSimulator";
import type { PhysicsConfig } from "../physics/types";

export class CarPhysics {
  private config: Required<CarConfig>;
  private jumpSimulator: JumpSimulator;
  private jumpState: JumpState;
  private jumpHeight = 0;
  private physicsConfig: PhysicsConfig = {
    ...useCommonStore().getBasePhysics(),
  };

  constructor(config: Partial<CarConfig> = {}) {
    this.config = {
      ...usePlayerStore().getDefaultCarConfig(),
      ...config,
    };
    this.jumpHeight = this.config.jumpHeight;
    this.jumpSimulator = new JumpSimulator({
      jumpHeight: this.jumpHeight,
      gravity: this.physicsConfig.gravity!,
      groundY: useCommonStore().baseItemYpos + 0.6,
    });

    this.jumpState = this.jumpSimulator.createInitialState();
  }

  public startJump(currentY: number): void {
    this.refreshRuntimeConfig();
    this.jumpSimulator = new JumpSimulator({
      jumpHeight: this.jumpHeight,
      gravity: this.physicsConfig.gravity!,
      groundY: currentY,
    });
    this.jumpSimulator.setGroundY(currentY);
    this.jumpState = this.jumpSimulator.startJump({
      ...this.jumpState,
      y: currentY,
    });
  }

  public updateJump(
    currentY: number,
    deltaTime: number,
    groundY?: number,
  ): {
    newY: number;
    isJumping: boolean;
    pitch: number;
    hasLanded: boolean;
  } {
    if (groundY !== undefined) {
      this.jumpSimulator.setGroundY(groundY);
    }

    // Если прыжок не активен – просто возвращаем текущую высоту,
    // а внутреннее состояние подгоняем под неё (для корректного старта в будущем)
    if (!this.jumpState.isJumping) {
      const targetY = groundY ?? currentY;
      if (targetY < currentY - 0.25) {
        this.jumpState = {
          y: currentY,
          velocity: 0,
          isJumping: true,
        };
      } else {
        const frameScale = Math.max(0, Math.min(deltaTime, 50)) / (1000 / 60);
        const followFactor = 1 - Math.pow(1 - 0.32, frameScale);
        const newY = currentY + (targetY - currentY) * followFactor;
        this.jumpState.y = newY;
        return {
          newY,
          isJumping: false,
          pitch: 0,
          hasLanded: false,
        };
      }
    }

    // Преобразуем deltaTime в секунды
    const dtSeconds = deltaTime / 1000;
    // Активная фаза прыжка – используем симуляцию
    const prevVelocity = this.jumpState.velocity;
    const prevIsJumping = this.jumpState.isJumping;

    const simMultiplier = usePlayerStore().forceJump
      ? usePlayerStore().FORCED_JUMP_MULTIPLIER
      : 1;
    this.jumpState = this.jumpSimulator.step(
      this.jumpState,
      dtSeconds * simMultiplier,
    );

    const hasLanded = prevIsJumping && !this.jumpState.isJumping;

    let pitch = prevVelocity > 0 ? 0.08 : -0.025;
    if (usePlayerStore().forceJump) pitch = -0.08;
    return {
      newY: this.jumpState.y,
      isJumping: this.jumpState.isJumping,
      pitch,
      hasLanded: hasLanded && usePlayerStore().forceJump,
    };
  }

  public updateLaneMovement(
    currentX: number,
    targetX: number,
    currentRotationY: number,
    deltaTime: number,
  ): { newX: number; newRotationY: number } {
    this.refreshRuntimeConfig();
    const deltaX = targetX - currentX;

    if (isNaN(deltaX)) {
      return { newX: currentX, newRotationY: currentRotationY };
    }

    const frameScale = Math.max(0, Math.min(deltaTime, 50)) / (1000 / 60);
    const laneChangeFactor =
      1 - Math.pow(1 - this.config.laneChangeSpeed, frameScale);
    const tiltFactor = 1 - Math.pow(1 - this.config.tiltSmoothing, frameScale);

    const newX = currentX + deltaX * laneChangeFactor;

    const newRotationY =
      currentRotationY +
      (-deltaX * this.config.maxTilt - currentRotationY) * tiltFactor;

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

      // Уменьшенная сила разлёта для машины
      const forceMultiplier = 0.7;
      const baseVel = new THREE.Vector3(
        (Math.random() - 0.5) *
          this.physicsConfig.explosionForce! *
          forceMultiplier,
        Math.random() * this.physicsConfig.explosionUpward! * forceMultiplier +
          0.1,
        (Math.random() - 0.5) *
          this.physicsConfig.explosionForce! *
          forceMultiplier,
      );

      if (impactPoint) {
        const dir = cube.position.clone().sub(impactPoint).normalize();
        dir.multiplyScalar(
          this.physicsConfig.explosionForce! * forceMultiplier,
        );
        baseVel.add(dir); // суммируем случайный и направленный вектор
      }

      const userData = cube.userData as any;
      userData.velocity = baseVel;
      userData.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed!,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed!,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed!,
      );
    });
  }

  public updateDestroyedCubes(
    cubes: THREE.Object3D[],
    scene: THREE.Scene,
    dt: number = 0.016,
  ): void {
    const edges = RoadManager.getInstance()
      .getEdges()
      .filter((e) => e instanceof RoadEdge) as RoadEdge[];

    CubePhysics.update(
      cubes,
      this.physicsConfig as CubePhysicsConfig,
      edges,
      dt,
      (cube) => {
        // удаляем куб из сцены
        scene.remove(cube);
      },
    );
  }

  public reset(): void {
    this.jumpState = this.jumpSimulator.createInitialState();
  }

  private refreshRuntimeConfig(): void {
    const playerStore = usePlayerStore();
    this.config = {
      ...this.config,
      ...playerStore.getRuleOptions(),
      ...playerStore.getJumpOptions(),
    };
    this.jumpHeight = this.config.jumpHeight;
  }

  public getState() {
    return {
      isJumping: this.jumpState.isJumping,
      jumpVelocity: this.jumpState.velocity,
      targetPitch: this.jumpState.isJumping
        ? this.jumpState.velocity > 0
          ? 0.08
          : -0.025
        : 0,
    };
  }
}
