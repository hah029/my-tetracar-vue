import * as THREE from "three";
import { Bullet } from "./Bullet";
import { Car } from "../car";
import { ObstacleManager } from "../interactive/obstacle";

export class BulletSystem {
  private static instance: BulletSystem;

  private bullets: Bullet[] = [];
  private scene!: THREE.Scene;

  private readonly MAX_DISTANCE = 50;

  private bulletBox = new THREE.Box3();
  private obstacleBox = new THREE.Box3();

  static getInstance(): BulletSystem {
    if (!this.instance) {
      this.instance = new BulletSystem();
    }
    return this.instance;
  }

  initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnBullet(car: Car) {
    const lane = car.getCurrentLane();

    const bullet = new Bullet(lane);

    bullet.position.copy(car.position);
    bullet.position.y = 0.15;
    bullet.position.z -= 1;

    this.scene.add(bullet);
    this.bullets.push(bullet);
  }

  update(dt: number) {
    const obstacles = ObstacleManager.getInstance().getObstacles();

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      if (!bullet) continue;

      // =================
      // движение пули
      // =================

      bullet.update(dt);

      // =================
      // обновляем collider пули
      // =================

      this.bulletBox.setFromObject(bullet);

      let removed = false;

      // =================
      // COLLISION CHECK
      // =================

      for (const obstacle of obstacles) {
        if (!obstacle) continue;

        if (obstacle.getLane() !== bullet.lane) continue;

        this.obstacleBox.setFromObject(obstacle);

        if (this.bulletBox.intersectsBox(this.obstacleBox)) {
          obstacle.destroy(bullet.position.clone());

          this.scene.remove(bullet);
          this.bullets.splice(i, 1);

          removed = true;
          break;
        }
      }

      if (removed) continue;

      // =================
      // LIMIT DISTANCE
      // =================

      if (bullet.position.z < -this.MAX_DISTANCE) {
        this.scene.remove(bullet);
        this.bullets.splice(i, 1);
      }
    }
  }

  reset() {
    for (const bullet of this.bullets) {
      this.scene.remove(bullet);
    }

    this.bullets.length = 0;
  }

  getBullets(): Bullet[] {
    return this.bullets;
  }
}
