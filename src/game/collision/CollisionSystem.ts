import * as THREE from "three";
import type { Obstacle } from "../Obstacle";

const DANGER_DISTANCE = 30;
const COLLISION_COOLDOWN_MS = 1000;

type CollisionResult = {
  collision: boolean;
  impactPoint?: THREE.Vector3;
};

class CollisionSystemClass {
  private collisionCooldown = false;
  private cooldownTimer: number | null = null;

  initialize() {
    this.reset();
  }

  reset() {
    this.collisionCooldown = false;
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  checkCollision(
    car: {
      isDestroyed(): boolean;
      getCollider(): THREE.Box3 | THREE.Sphere;
    },
    obstacles: Obstacle[],
  ): CollisionResult {
    if (car.isDestroyed()) return { collision: false };
    if (this.collisionCooldown) return { collision: false };

    for (const obstacle of obstacles) {
      const obstacleCollider = obstacle.collider;
      if (!obstacleCollider) continue;

      const carCollider = car.getCollider();

      const intersects =
        obstacleCollider instanceof THREE.Box3
          ? obstacleCollider.intersectsBox(carCollider as THREE.Box3)
          : obstacleCollider.intersectsSphere(carCollider as THREE.Sphere);

      if (intersects) {
        this.collisionCooldown = true;

        this.cooldownTimer = window.setTimeout(() => {
          this.collisionCooldown = false;
        }, COLLISION_COOLDOWN_MS);

        return {
          collision: true,
          impactPoint: obstacle.position.clone(),
        };
      }
    }

    return { collision: false };
  }

  getDangerLevel(
    car: {
      position: THREE.Vector3;
      isDestroyed(): boolean;
    },
    obstacles: {
      position: THREE.Vector3;
    }[],
  ): number {
    if (car.isDestroyed()) return 0;

    const carPos = car.position.clone();
    let maxDanger = 0;

    for (const obstacle of obstacles) {
      const obstaclePos = obstacle.position.clone();

      // препятствие впереди — не опасно
      if (obstaclePos.z >= carPos.z) continue;

      const zDiff = Math.abs(obstaclePos.z - carPos.z);
      const xDiff = Math.abs(obstaclePos.x - carPos.x);

      if (zDiff > DANGER_DISTANCE * 2 || xDiff > 1.0) continue;

      const dangerByZ = Math.max(0, 1 - zDiff / DANGER_DISTANCE);
      const dangerByX = Math.max(0, 1 - xDiff / 1.0);

      const danger = dangerByZ * 0.7 + dangerByX * 0.3;
      maxDanger = Math.max(maxDanger, danger);
    }

    return maxDanger;
  }
}

export const CollisionSystem = new CollisionSystemClass();
