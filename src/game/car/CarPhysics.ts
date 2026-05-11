// src/game/car/CarPhysics

import * as THREE from "three";
import { RoadManager } from "../road/RoadManager";
import { RoadEdge } from "../road/edges/RoadEdge";
import { CubePhysics } from "@/game/physics/CubePhysics";
import type { PhysicsConfig } from "../physics/types";
import { useCommonStore } from "@/store/commonStore";
import { usePlayerStore } from "@/store/playerStore";
import type { CarConfig } from ".";
import { JumpSimulator, type JumpState } from "../physics/JumpSimulator";

export class CarPhysics {
  private config: Required<CarConfig>;
  private jumpSimulator: JumpSimulator;
  private jumpState: JumpState;
  private physicsConfig: Required<PhysicsConfig> = {
    ...useCommonStore().getBasePhysics(),
  };

  constructor(config: Partial<CarConfig> = {}) {
    this.config = {
      ...usePlayerStore().getDefaultCarConfig(),
      ...config,
    };
    this.jumpSimulator = new JumpSimulator({
      jumpHeight: this.config.jumpHeight,
      gravity: useCommonStore().GRAVITY,
      groundY: useCommonStore().BASE_ITEM_YPOS + 0.6,
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

  public updateJump(
    currentY: number,
    deltaTime: number,
  ): {
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

    // Преобразуем deltaTime в секунды
    const dtSeconds = deltaTime / 1000;
    // Активная фаза прыжка – используем симуляцию
    const prevVelocity = this.jumpState.velocity;

    const simMultiplier = usePlayerStore().forceJump
      ? usePlayerStore().FORCED_JUMP_MULTIPLIER
      : 1;
    this.jumpState = this.jumpSimulator.step(
      this.jumpState,
      dtSeconds * simMultiplier,
    );

    let pitch = prevVelocity > 0 ? 0.2 : -0.1;
    if (usePlayerStore().forceJump) pitch = -0.3;
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

      // Уменьшенная сила разлёта для машины
      const forceMultiplier = 0.7;
      const baseVel = new THREE.Vector3(
        (Math.random() - 0.5) *
          this.physicsConfig.explosionForce *
          forceMultiplier,
        Math.random() * this.physicsConfig.explosionUpward * forceMultiplier +
          0.1,
        (Math.random() - 0.5) *
          this.physicsConfig.explosionForce *
          forceMultiplier,
      );

      if (impactPoint) {
        const dir = cube.position.clone().sub(impactPoint).normalize();
        dir.multiplyScalar(this.physicsConfig.explosionForce * forceMultiplier);
        baseVel.add(dir); // суммируем случайный и направленный вектор
      }

      const userData = cube.userData as any;
      userData.velocity = baseVel;
      userData.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
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

    CubePhysics.update(cubes, this.physicsConfig, edges, dt, (cube) => {
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
