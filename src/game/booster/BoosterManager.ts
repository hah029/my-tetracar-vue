import * as THREE from "three";
import { Nitro } from "./Nitro";
import { Car } from "@/game/car/Car";

export class BoosterManager {
  private static instance: BoosterManager | null = null;
  private nitros: Nitro[] = [];
  private scene!: THREE.Scene;

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

  public spawnNitro(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
  ): void {
    const nitro = new Nitro(laneIndex, zPos, yPos);
    this.nitros.push(nitro);
    this.scene.add(nitro);
  }

  /* =======================
     UPDATE
     ======================= */

  public update(speed: number): void {
    for (let i = this.nitros.length - 1; i >= 0; i--) {
      const nitro = this.nitros[i];
      if (nitro === undefined) continue;
      if (nitro.update(speed)) {
        this.removeNitro(i);
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
      "collision": false,
      "subject": "",
    }

    // Проверка коллизии с нитро-бустером
    for (let i = this.nitros.length - 1; i >= 0; i--) {
      const nitro = this.nitros[i];
      if (nitro === undefined) continue;

      if (carCollider.intersectsSphere(nitro.collider)) {
        collisions["subject"] = "nitro";
        collisions["collision"] = true;
        this.removeNitro(i);
      }
    }

    return collisions;
  }

  /* =======================
     HELPERS
     ======================= */

  private removeNitro(index: number): void {
    const nitro = this.nitros[index];
    if (nitro === undefined) return;
    this.scene.remove(nitro);
    this.nitros.splice(index, 1);
  }

  /* =======================
     RESET / GETTERS
     ======================= */

  public reset(): void {
    this.nitros.forEach((coin) => this.scene.remove(coin));
    this.nitros = [];
  }

  public getNitros(): Nitro[] {
    return this.nitros;
  }
}
