import * as THREE from "three";
import type { Jump } from "@/game/interactive/obstacle/Jump";
import type { BaseObstacle } from "@/game/interactive/obstacle/BaseObstacle";
import type { Car } from "../car";
import type { BaseItem } from "../interactive/items/BaseItem";
import { useCommonStore } from "@/store/commonStore";

export type CollisionResult = {
  impactPoint?: THREE.Vector3;
  impactSubject?: BaseObstacle | Jump | BaseItem;
};

export class CollisionSystem {
  private static instance: CollisionSystem | null = null;
  private lastCollisionTime = 0;

  public static getInstance(): CollisionSystem {
    if (!CollisionSystem.instance) {
      CollisionSystem.instance = new CollisionSystem();
    }
    return CollisionSystem.instance;
  }

  reset() {
    this.lastCollisionTime = 0;
  }

  public checkObstacleCollision(
    car: Car,
    jumps: Jump[] = [],
    obstacles: BaseObstacle[] = [],
    now?: number, // текущее время в миллисекундах (опционально)
  ): CollisionResult | null {
    if (car.isDestroyed()) return null;

    const currentTime = now ?? performance.now();

    for (const jump of jumps) {
      if (jump.userData.activated) continue;

      if (car.checkJumpCollision(jump)) {
        jump.userData.activated = true;
        // this.lastCollisionTime = currentTime;
        return {
          impactPoint: jump.position.clone(),
          impactSubject: jump,
        };
      }
    }

    // если на кулдауне — проверяем только трамплины, препятствия не трогаем
    if (
      currentTime - this.lastCollisionTime <
      useCommonStore().COLLISION_COOLDOWN_MS
    ) {
      return null;
    }

    // проверка препятствий (только если кулдаун прошёл)
    for (const obstacle of obstacles) {
      const collides = car.checkObstacleCollision(obstacle);

      if (collides) {
        this.lastCollisionTime = currentTime;
        car.startShieldCooldown(useCommonStore().COLLISION_COOLDOWN_MS / 1000);
        return {
          impactSubject: obstacle,
          impactPoint: obstacle.position.clone(),
        };
      }
    }

    return null;
  }

  public checkItemsCollision(
    car: Car,
    items: BaseItem[],
  ): CollisionResult | null {
    const carCollider = car.getCollider();

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item === undefined) continue;

      if (carCollider.intersectsSphere(item.collider)) {
        return {
          impactSubject: item,
        };
      }
    }

    return null;
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

      if (zDiff > useCommonStore().DANGER_DISTANCE * 2 || xDiff > 1.0) continue;

      const dangerByZ = Math.max(
        0,
        1 - zDiff / useCommonStore().DANGER_DISTANCE,
      );
      const dangerByX = Math.max(0, 1 - xDiff / 1.0);

      const danger = dangerByZ * 0.7 + dangerByX * 0.3;
      maxDanger = Math.max(maxDanger, danger);
    }

    return maxDanger;
  }
}
