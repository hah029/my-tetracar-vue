import * as THREE from "three";
import { BulletItem } from "./BulletItem";
import { Car } from "@/game/car/Car";
import type { BaseItem } from "../BaseItem";

export class BulletItemManager {
  private static instance: BulletItemManager | null = null;
  private items: BaseItem[] = [];
  private scene!: THREE.Scene;

  public static getInstance(): BulletItemManager {
    if (!BulletItemManager.instance) {
      BulletItemManager.instance = new BulletItemManager();
    }
    return BulletItemManager.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  /* =======================
     SPAWN
     ======================= */

  public spawnBullet(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 10,
  ): void {
    const coin = new BulletItem(laneIndex, zPos, yPos, value);
    this.items.push(coin);
    this.scene.add(coin);
  }

  /* =======================
     UPDATE
     ======================= */

  public update(deltaTime: number, speed: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const coin = this.items[i];
      if (coin === undefined) continue;
      const shouldRemove = coin.update(deltaTime, speed);

      if (shouldRemove) {
        this.removeBullet(i);
      }
    }
  }

  /* =======================
     COLLISION
     ======================= */

  /**
   * Проверка подбора монеток машиной
   * @returns сумма очков, собранных за этот кадр
   */
  public checkCarCollision(car: Car) {
    let collected = 0;
    const carCollider = car.getCollider();
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item === undefined) continue;

      if (carCollider.intersectsSphere(item.collider)) {
        collected += 1;
        this.removeBullet(i);
      }
    }
    return collected;
  }

  /* =======================
     HELPERS
     ======================= */

  private removeBullet(index: number): void {
    const item = this.items[index];
    if (item === undefined) return;
    this.scene.remove(item);
    this.items.splice(index, 1);
  }

  /* =======================
     RESET / GETTERS
     ======================= */

  public reset(): void {
    this.items.forEach((coin) => this.scene.remove(coin));
    this.items = [];
  }

  public getBullets(): BaseItem[] {
    return this.items;
  }
}
