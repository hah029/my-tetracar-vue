import * as THREE from "three";
import { GoldCoin } from "./Gold";
import { DiamondCoin } from "./Diamond";
import { Car } from "@/game/car/Car";
import type { BaseItem } from "../BaseItem";

export class CoinManager {
  private static instance: CoinManager | null = null;
  private coins: BaseItem[] = [];
  private scene!: THREE.Scene;

  public static getInstance(): CoinManager {
    if (!CoinManager.instance) {
      CoinManager.instance = new CoinManager();
    }
    return CoinManager.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  /* =======================
     SPAWN
     ======================= */

  public spawnGold(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 10,
  ): void {
    const coin = new GoldCoin(laneIndex, zPos, yPos, value);
    this.coins.push(coin);
    this.scene.add(coin);
  }

  public spawnDiamond(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 1,
  ): void {
    const coin = new DiamondCoin(laneIndex, zPos, yPos, value);
    this.coins.push(coin);
    this.scene.add(coin);
  }

  /* =======================
     UPDATE
     ======================= */

  public update(deltaTime: number, speed: number): void {
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin === undefined) continue;
      const shouldRemove = coin.update(deltaTime, speed);

      if (shouldRemove) {
        this.removeCoin(i);
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
    let collected = {
      gold: 0,
      diamond: 0,
      total: 0,
    };
    const carCollider = car.getCollider();
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin === undefined) continue;

      if (carCollider.intersectsSphere(coin.collider)) {
        collected[coin.itemType] += coin.value;
        collected["total"] += coin.value;
        this.removeCoin(i);
      }
    }
    return collected;
  }

  /* =======================
     HELPERS
     ======================= */

  private removeCoin(index: number): void {
    const coin = this.coins[index];
    if (coin === undefined) return;
    this.scene.remove(coin);
    this.coins.splice(index, 1);
  }

  /* =======================
     RESET / GETTERS
     ======================= */

  public reset(): void {
    this.coins.forEach((coin) => this.scene.remove(coin));
    this.coins = [];
  }

  public getCoins(): BaseItem[] {
    return this.coins;
  }
}
