import * as THREE from "three";
import { Bullet } from "./Bullet";
import { Car } from "../car";
import { ObstacleManager } from "../interactive/obstacle";
import { useProgressStore } from "@/store/progressStore";
import { useCommonStore } from "@/store/commonStore";
import { FlashEffectManager } from "../effects/FlashEffectManager";
import { SoundManager } from "../sound/SoundManager";
import { RunTelemetry } from "@/telemetry";
import { getObstacleKind } from "../interactive/obstacle/telemetry";
import { RoadManager } from "../environment/road";
import type { BulletVariant } from "./BulletVariant";

export class BulletSystem {
  private static instance: BulletSystem | null = null;

  private bullets: Bullet[] = [];
  private scene!: THREE.Scene;

  private readonly MAX_DISTANCE = useCommonStore().config.bulletMaxDistance;

  private bulletBox = new THREE.Box3();
  private obstacleBox = new THREE.Box3();

  public static getInstance(): BulletSystem {
    if (!BulletSystem.instance) {
      BulletSystem.instance = new BulletSystem();
    }
    return BulletSystem.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnBullet(car: Car, variant: BulletVariant = "normal", speed?: number) {
    const lane = car.getCurrentLane();

    if (variant === "fan") {
      const lanesCount = RoadManager.getInstance().getLanesCount();
      for (const laneOffset of [-1, 0, 1]) {
        const targetLane = lane + laneOffset;
        if (targetLane < 0 || targetLane >= lanesCount) continue;
        // All rounds leave the same muzzle point, then split at a broad angle.
        const fanBullet = new Bullet(
          targetLane,
          "normal",
          speed,
          laneOffset * 0.055,
        );
        fanBullet.position.copy(car.position);
        fanBullet.position.y = car.position.y + useCommonStore().baseItemYpos;
        fanBullet.position.z = car.position.z - 1;
        this.scene.add(fanBullet);
        this.bullets.push(fanBullet);
      }
      return;
    }
    const bullet = new Bullet(lane, variant, speed);

    bullet.position.copy(car.position);
    bullet.position.y = car.position.y + useCommonStore().baseItemYpos;
    bullet.position.z = variant === "railgun" ? car.position.z - 50 : car.position.z - 1;

    this.scene.add(bullet);
    this.bullets.push(bullet);
  }

  update(dt: number) {
    const obstacles = ObstacleManager.getInstance().getObstacles();
    const progressStore = useProgressStore();

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      if (!bullet) continue;
      bullet.update(dt);
      if (bullet.variant === "blank") {
        if (bullet.position.z < -this.MAX_DISTANCE) {
          RunTelemetry.recordShotMissed();
          this.scene.remove(bullet);
          this.bullets.splice(i, 1);
        }
        continue;
      }
      this.bulletBox.setFromObject(bullet);

      // дополнительно увеличиваем бокс коллайдера в два раза
      // (чтобы уменьшить шанс пролета пули сквозь препятствие)
      this.bulletBox.expandByScalar(1.1);

      let removed = false;
      for (const obstacle of obstacles) {
        if (!obstacle) continue;
        if (bullet.hitObstacles.has(obstacle)) continue;

        if (obstacle.getLane() !== bullet.getLane()) continue;

        this.obstacleBox.setFromObject(obstacle);

        if (this.bulletBox.intersectsBox(this.obstacleBox)) {
          bullet.hitObstacles.add(obstacle);
          this.destroyObstacle(obstacle, bullet.position.clone(), progressStore);
          if (bullet.variant === "explosive") {
            for (const nearby of obstacles) {
              if (nearby === obstacle) continue;
              if (nearby.position.distanceTo(bullet.position) <= 7) {
                if (bullet.hitObstacles.has(nearby)) continue;
                bullet.hitObstacles.add(nearby);
                this.destroyObstacle(nearby, bullet.position.clone(), progressStore);
              }
            }
          }
          bullet.remainingHits--;
          if (bullet.remainingHits <= 0) {
            this.scene.remove(bullet);
            this.bullets.splice(i, 1);
            removed = true;
          }
          FlashEffectManager.getInstance().spawnExplosion(
            "bullet",
            bullet.position,
          );
          break;
        }
      }

      if (removed) continue;

      if (bullet.variant === "railgun" && performance.now() - bullet.createdAt > 150) {
        this.scene.remove(bullet);
        this.bullets.splice(i, 1);
      } else if (bullet.position.z < -this.MAX_DISTANCE) {
        RunTelemetry.recordShotMissed();
        this.scene.remove(bullet);
        this.bullets.splice(i, 1);
      }
    }
  }

  private destroyObstacle(obstacle: any, position: THREE.Vector3, progressStore: ReturnType<typeof useProgressStore>) {
    obstacle.destroy(position, true);
    progressStore.calcScore("bulletHit", 1);
    RunTelemetry.recordShotHit();
    RunTelemetry.recordObstacleDestroyed("bullet", getObstacleKind(obstacle));
    SoundManager.getInstance().playCue("bulletHit");
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
