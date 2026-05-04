import * as THREE from "three";
import { Nitro } from "./Nitro";
import { Shield } from "./Shield";
import { Magnet } from "./Magnet";
import { Car } from "@/game/car/Car";
import type { BaseItem } from "../BaseItem";

export class BoosterManager {
  private static instance: BoosterManager | null = null;
  private boosters: BaseItem[] = [];
  private scene!: THREE.Scene;

  public readonly spawnProbabilities = {
    nitro: 1,
    shield: 1,
    magnet: 1,
  };

  public static getInstance(): BoosterManager {
    if (!BoosterManager.instance) {
      BoosterManager.instance = new BoosterManager();
    }
    return BoosterManager.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  /* =======================
     SPAWN
     ======================= */

  public spawnNitro(laneIndex: number, zPos: number, yPos?: number): void {
    console.log("spawnNitro", this);
    const booster = new Nitro(laneIndex, zPos, yPos);

    this.boosters.push(booster);
    this.scene.add(booster);
  }

  public spawnMagnet(laneIndex: number, zPos: number, yPos?: number): void {
    console.log("spawnMagnet", this);
    const booster = new Magnet(laneIndex, zPos, yPos);
    this.boosters.push(booster);
    this.scene.add(booster);
  }

  public spawnShield(laneIndex: number, zPos: number, yPos?: number): void {
    console.log("spawnShield", this);
    const booster = new Shield(laneIndex, zPos, yPos);

    this.boosters.push(booster);
    this.scene.add(booster);
  }

  /* =======================
     UPDATE
     ======================= */

  public update(deltaTime: number, speed: number): void {
    for (let i = this.boosters.length - 1; i >= 0; i--) {
      const booster = this.boosters[i];
      if (booster === undefined) continue;
      if (booster.update(deltaTime, speed)) {
        this.removeBooster(i);
      }
    }
  }

  /* =======================
     COLLISION
     ======================= */

  /**
   * Проверка подбора нитро-буста машиной
   * @returns флаг подбора буста для изменения состояния машины
   */
  public checkCarCollision(car: Car) {
    const carCollider = car.getCollider();

    let collisions = {
      collision: false,
      subject: "",
    };

    // Проверка коллизии с бустером
    for (let i = this.boosters.length - 1; i >= 0; i--) {
      const booster = this.boosters[i];
      if (booster === undefined) continue;

      if (carCollider.intersectsSphere(booster.collider)) {
        collisions["subject"] = booster.itemType;
        collisions["collision"] = true;
        this.removeBooster(i);
      }
    }

    return collisions;
  }

  /* =======================
     HELPERS
     ======================= */

  private removeBooster(index: number): void {
    const booster = this.boosters[index];
    if (booster === undefined) return;
    this.scene.remove(booster);
    this.boosters.splice(index, 1);
  }

  /* =======================
     RESET / GETTERS
     ======================= */

  public reset(): void {
    this.boosters.forEach((coin) => this.scene.remove(coin));
    this.boosters = [];
  }

  public getBoosters(): Nitro[] {
    return this.boosters;
  }
}
