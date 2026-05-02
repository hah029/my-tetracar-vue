import * as THREE from "three";
import { Golden } from "./Golden";
import { Energon } from "./Energon";
import { Car } from "@/game/car/Car";
import type { BaseItem } from "../BaseItem";
import type { CoinType } from "./types";
import type { CoinItem } from "./CoinItem";
import { useCommonStore } from "@/store/commonStore";

export class CoinManager {
  private static instance: CoinManager | null = null;
  private coins: CoinItem[] = [];
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

  public spawnGolden(
    laneIndex: number,
    zPos: number,
    yPos?: number,
    value?: number,
  ): void {
    const coin = new Golden(laneIndex, zPos, yPos, value);
    this.coins.push(coin);
    this.scene.add(coin);
  }

  public spawnEnergon(
    laneIndex: number,
    zPos: number,
    yPos?: number,
    value?: number,
  ): void {
    const coin = new Energon(laneIndex, zPos, yPos, value);
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
      golden: 0,
      energon: 0,
      total: 0,
    };
    const carCollider = car.getCollider();
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin === undefined) continue;

      if (carCollider.intersectsSphere(coin.collider)) {
        const itemType = coin.itemType as CoinType;
        collected[itemType] += coin.getValue();
        collected["total"] += coin.getValue();
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
