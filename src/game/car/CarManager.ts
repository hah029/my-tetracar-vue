// src/game/car/CarManager.ts
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
    // console.log('CarManager.initialize called with scene:', scene);
    this.scene = scene;
  }

  public createCar(config?: CarConfig): Car {
    // console.log('CarManager.createCar called');
    
    if (!this.scene) {
      throw new Error('CarManager not initialized with scene. Call initialize() first.');
    }
    
    if (this.car) {
      // console.log('Destroying existing car');
      this.destroyCar();
    }
    
    // console.log('Creating new Car with scene:', this.scene);
    this.car = new Car(this.scene, config);
    // console.log('Car created successfully');
    return this.car;
  }

  public getCar(): Car {
    if (!this.car) {
      throw new Error('Car not created. Call createCar() first.');
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
  public update(): void {
    if (this.car) {
      this.car.update();
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

  public async buildCar(useGLB: boolean = true, cubeModelUrl: string = ''): Promise<void> {
    if (this.car) {
      await this.car.build(useGLB, cubeModelUrl);
    }
  }

  public resetCar(): void {
    if (this.car) {
      this.car.reset();
    }
  }

  public getStats(): CarStats | null {
    if (!this.car) return null;
    
    return {
      currentLane: this.car.getCurrentLane(),
      position: this.car.position.clone(),
      isDestroyed: this.car.isDestroyed(),
      isJumping: this.car.isJumping(),
      cubesCount: this.car.getCubes().length
    };
  }

  public isReady(): boolean {
    return this.car !== null;
  }
}

// Экспортируем единственный экземпляр
export const carManager = CarManager.getInstance();