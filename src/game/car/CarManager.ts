// src/game/car/CarManager.ts
import { useGameState } from "@/store/gameState";
import { Car } from "./Car";
import { type CarConfig, type CarStats } from "./types";
import * as THREE from "three";

export class CarManager {
  private static instance: CarManager | null = null;
  private car: Car | null = null;
  private scene: THREE.Scene | null = null;

  private constructor() {}

  public static getInstance(): CarManager {
    if (!CarManager.instance) {
      CarManager.instance = new CarManager();
    }
    return CarManager.instance;
  }

  public initialize(scene: THREE.Scene): void {
    this.scene = scene;
  }

  public createCar(config?: CarConfig): Car {
    if (!this.scene) {
      throw new Error(
        "CarManager not initialized with scene. Call initialize() first.",
      );
    }
    if (this.car) {
      this.destroyCar();
    }

    this.car = new Car(this.scene, config);
    return this.car;
  }

  public getCar(): Car {
    if (!this.car) {
      throw new Error("Car not created. Call createCar() first.");
    }
    return this.car;
  }

  public destroyCar(): void {
    if (this.car) {
      // Очищаем ресурсы
      if (this.scene) {
        this.scene.remove(this.car);
      }
      this.car = null;
    }
  }
  public update(dt: number): void {
    if (this.car) {
      this.car.update(dt);
      this.car.toggleDebugCollider(useGameState().isDebug);
    }
  }

  public moveLeft(): void {
    if (this.car) {
      this.car.moveLeft();
    }
  }

  public moveRight(): void {
    if (this.car) {
      this.car.moveRight();
    }
  }

  public jump(): void {
    if (this.car) {
      this.car.jump();
    }
  }

  public async buildCar(useGLB: boolean = true): Promise<void> {
    if (this.car) {
      await this.car.build(useGLB);
      this.car.toggleDebugCollider(useGameState().isDebug);
    } else {
      console.warn(`[CarManager] no car to build`);
    }
  }

  public resetCar(): void {
    if (this.car) {
      this.car.reset(true);
    }
  }

  public getStats(): CarStats | null {
    if (!this.car) return null;

    return {
      currentLane: this.car.getCurrentLane(),
      position: this.car.position.clone(),
      isDestroyed: this.car.isDestroyed(),
      isJumping: this.car.isJumping(),
      cubesCount: this.car.getCubes().length,
    };
  }

  public isReady(): boolean {
    return this.car !== null;
  }

  public enableNitro() {
    this.car?.enableNitro();
  }

  public disableNitro() {
    this.car?.disableNitro();
  }

  public enableShield() {
    this.car?.enableShield();
  }

  public disableShield() {
    this.car?.disableShield();
  }

  // public setVisualMode(mode: "default" | "nitro" | "shield" | "damage") {
  //   switch (mode) {
  //     case "nitro":
  //       this.car?.enableNitro();
  //       break;
  //     case "shield":
  //       this.car?.enableShield();
  //       break;
  //     case "damage":
  //       this.car?.showDamage();
  //       break;
  //     default:
  //       const playerStore = usePlayerStore();
  //       if (playerStore.isNitroEnabled) this.car?.disableNitro();
  //       if (playerStore.isShieldEnabled) this.car?.disableShield();
  //       break;
  //   }
  // }
}
