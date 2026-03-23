import * as THREE from "three";
import type { Jump } from "@/game/interactive/obstacle/Jump";
import type { BaseObstacle } from "@/game/interactive/obstacle/BaseObstacle";
import type { Car } from "../car";

const DANGER_DISTANCE = 30;
const COLLISION_COOLDOWN_MS = 1000;

type CollisionResult = {
  collision: boolean;
  impactPoint?: THREE.Vector3;
  jump?: boolean;
  obstacle?: BaseObstacle;
};

class CollisionSystemClass {
  private lastCollisionTime = 0;

  reset() {
    this.lastCollisionTime = 0;
  }

  checkCollision(
    car: Car,
    jumps: Jump[] = [],
    obstacles: BaseObstacle[] = [],
    now?: number, // текущее время в миллисекундах (опционально)
  ): CollisionResult {
    if (car.isDestroyed()) return { collision: false };

    const currentTime = now ?? performance.now();
    if (currentTime - this.lastCollisionTime < COLLISION_COOLDOWN_MS) {
      return { collision: false };
    }

    // Проверка препятствий из кубиков
    for (const obstacle of obstacles) {
      const collides = car.checkObstacleCollision(obstacle);
      if (collides) {
        this.lastCollisionTime = currentTime;
        car.startShieldCooldown(COLLISION_COOLDOWN_MS / 1000);
        // obstacle.destroy();
        return {
          collision: true,
          obstacle: obstacle,
          impactPoint: obstacle.position.clone(),
        };
      }
    }

    // Проверка трамплинов
    for (const jump of jumps) {
      if (jump.userData.activated) continue;
      if (car.checkJumpCollision(jump)) {
        jump.userData.activated = true;
        this.lastCollisionTime = currentTime;
        return {
          collision: true,
          impactPoint: jump.position.clone(),
          jump: true,
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
    obstacles: { position: THREE.Vector3 }[],
  ): number {
    if (car.isDestroyed()) return 0;

    const carPos = car.position.clone();
    let maxDanger = 0;

    for (const obstacle of obstacles) {
      const obstaclePos = obstacle.position.clone();

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
