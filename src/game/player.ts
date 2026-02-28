// src/game/Player.ts
import * as THREE from "three";

import { Car } from ".//car";


export class Player {
  private car: Car;

  constructor() {
    this.car = new Car();
  }

  public getCar(): Car {
    return this.car;
  }

  public moveLeft(): void {
    this.car.moveLeft();
  }

  public moveRight(): void {
    this.car.moveRight();
  }

  public update(maxCarTilt: number): void {
    this.car.update(maxCarTilt);
  }

  public getCurrentLane(): number {
    return this.car.getCurrentLane();
  }

  public checkObstacleCollision(obstacle: THREE.Object3D): boolean {
    return this.car.checkObstacleCollision(obstacle);
  }

  public checkJumpCollision(jump: THREE.Object3D): boolean {
    return this.car.checkJumpCollision(jump);
  }

  public async buildCar(cubeModelUrl: string, useGLB: boolean = true): Promise<void> {
    await this.car.buildFromCubes(cubeModelUrl, useGLB);
  }

  public destroyCar(impactPoint: THREE.Vector3 | null = null): void {
    this.car.destroy(impactPoint);
  }

  public updateDestroyedCubes(): void {
    this.car.updateDestroyedCubes();
  }

  public reset(): void {
    this.car.reset();
  }

  public isDestroyed(): boolean {
    return this.car.userData.isDestroyed;
  }
}

// Создаем и экспортируем единственный экземпляр игрока
export const player = new Player();