import * as THREE from "three";

import type { CubeObstacle } from "@/game/interactive/obstacle/CubeObstacle";
import { ObstacleManager } from "@/game/interactive/obstacle/ObstacleManager";
import { Box3Helper } from "three";

export class DebugColliderVisualizer {
  private helpers: Map<CubeObstacle, Box3Helper> = new Map();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update() {
    const obstacles =
      ObstacleManager.getInstance().getObstacles() as CubeObstacle[];
    // Удаляем helpers для препятствий, которых больше нет
    for (const [obs, helper] of this.helpers) {
      if (!obstacles.includes(obs)) {
        this.scene.remove(helper);
        this.helpers.delete(obs);
      }
    }

    for (const obs of obstacles) {
      const collider = obs.getCollider();
      if (!collider) {
        // Если коллайдера нет, убираем helper
        const helper = this.helpers.get(obs);
        if (helper) {
          this.scene.remove(helper);
          this.helpers.delete(obs);
        }
        continue;
      }

      let helper = this.helpers.get(obs);
      if (!helper) {
        helper = new Box3Helper(collider, 0xff0000);
        this.scene.add(helper);
        this.helpers.set(obs, helper);
      } else {
        // Обновляем существующий helper
        helper.box.copy(collider);
      }
    }
  }
}
