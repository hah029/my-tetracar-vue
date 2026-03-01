import * as THREE from "three";
import { Coin } from "./Coin";
import { Car } from "@/game/car/Car";

export class CoinManager {
  private static instance: CoinManager | null = null;
  private coins: Coin[] = [];
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

  public spawnCoin(laneIndex: number, zPos: number, value: number = 10): void {
    const coin = new Coin(laneIndex, zPos, value);
    this.coins.push(coin);
    this.scene.add(coin);
  }

  /* =======================
     UPDATE
     ======================= */

  public update(speed: number): void {
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin === undefined) continue;
      const shouldRemove = coin.update(speed);

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
  public checkCarCollision(car: Car): number {
    let collectedValue = 0;
    const carCollider = car.getCollider();

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin === undefined) continue;

      if (carCollider.intersectsSphere(coin.collider)) {
        collectedValue += coin.value;
        this.removeCoin(i);
      }
    }

    return collectedValue;
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

  public getCoins(): Coin[] {
    return this.coins;
  }
}
