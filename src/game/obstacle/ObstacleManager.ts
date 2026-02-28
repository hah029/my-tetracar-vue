import * as THREE from "three";

import { Obstacle } from "./Obstacle";
import { RoadManager } from "@/game/road/RoadManager";
import type { ObstaclePatternOptions } from "./types";

export class ObstacleManager {
  private static instance: ObstacleManager;
  private obstacles: Obstacle[] = [];
  private scene: THREE.Scene | null = null;

  private constructor() {}

  // Получение экземпляра (синглтон)
  public static getInstance(): ObstacleManager {
    if (!ObstacleManager.instance) {
      ObstacleManager.instance = new ObstacleManager();
    }
    return ObstacleManager.instance;
  }

  public initialize(scene: THREE.Scene): void {
    // console.log('ObstacleManager.initialize called with scene:', scene);
    this.scene = scene;
  }

  // Получить все препятствия
  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  // Получить количество полос из RoadManager
  private getLanesCount(): number {
    try {
      const roadManager = RoadManager.getInstance();
      return roadManager.getLanesCount();
    } catch {
      // Fallback
      return 4;
    }
  }

  // Создать одно препятствие
  public spawnObstacle(
    laneIndex: number,
    zPos: number = -60,
    variant: number | null = null,
  ): Obstacle | null {
    const lanesCount = this.getLanesCount();

    if (laneIndex < 0 || laneIndex >= lanesCount) {
      console.warn(`Invalid lane index ${laneIndex}, max is ${lanesCount - 1}`);
      return null;
    }

    // Проверяем на дубликаты
    if (
      this.obstacles.some(
        (o) =>
          Math.abs(o.position.z - zPos) < 0.1 && o.userData.lane === laneIndex,
      )
    ) {
      return null;
    }

    try {
      const obstacle = new Obstacle(laneIndex, this.scene, zPos, variant);
      this.obstacles.push(obstacle);
      return obstacle;
    } catch (error) {
      console.error("Failed to spawn obstacle:", error);
      return null;
    }
  }

  // Создать ряд препятствий
  public spawnObstacleRow(
    laneIndex: number,
    zPos: number = -60,
    variant: number | null = null,
  ): Obstacle | null {
    return this.spawnObstacle(laneIndex, zPos, variant);
  }

  // Создать паттерн препятствий
  public spawnObstaclePattern(
    options: ObstaclePatternOptions = {},
  ): Obstacle[] {
    const { zPos = -60, pattern = "random", count, spacing = 4 } = options;

    const spawned: Obstacle[] = [];
    const lanesCount = this.getLanesCount();

    switch (pattern) {
      case "wall":
        // Стена из препятствий на всех полосах
        for (let i = 0; i < lanesCount; i++) {
          const obstacle = this.spawnObstacle(i, zPos, i);
          if (obstacle) spawned.push(obstacle);
        }
        break;

      case "zigzag":
        // Зигзаг
        for (let i = 0; i < lanesCount; i++) {
          const obstacle = this.spawnObstacle(i, zPos - i * spacing, i);
          if (obstacle) spawned.push(obstacle);
        }
        break;

      case "random":
      default:
        // Случайные препятствия
        const obstacleCount = count ?? 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < obstacleCount; i++) {
          const lane = Math.floor(Math.random() * lanesCount);
          const obstacle = this.spawnObstacle(lane, zPos - i * spacing);
          if (obstacle) spawned.push(obstacle);
        }
        break;
    }

    return spawned;
  }

  // Обновить все препятствия
  public update(speed: number): void {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      const shouldRemove = obstacle.update(speed);

      if (shouldRemove) {
        this.scene.remove(obstacle);
        this.obstacles.splice(i, 1);
      }
    }
  }

  // Сбросить все препятствия
  public reset(): void {
    this.obstacles.forEach((obstacle) => {
      this.scene.remove(obstacle);
    });
    this.obstacles = [];
  }

  // Получить препятствия в определенном диапазоне
  public getObstaclesInRange(zMin: number, zMax: number): Obstacle[] {
    return this.obstacles.filter(
      (obstacle) => obstacle.position.z >= zMin && obstacle.position.z <= zMax,
    );
  }

  // Проверить коллизию с препятствием
  public checkCollision(box: THREE.Box3): Obstacle | null {
    for (const obstacle of this.obstacles) {
      const obstacleBox = obstacle.getBoundingBox();
      if (box.intersectsBox(obstacleBox)) {
        return obstacle;
      }
    }
    return null;
  }

  // Удалить конкретное препятствие
  public removeObstacle(obstacle: Obstacle): void {
    const index = this.obstacles.indexOf(obstacle);
    if (index !== -1) {
      this.scene.remove(obstacle);
      this.obstacles.splice(index, 1);
    }
  }

  // Получить количество препятствий
  public getCount(): number {
    return this.obstacles.length;
  }

  // Получить статистику по препятствиям
  public getStats(): { total: number; byLane: Map<number, number> } {
    const byLane = new Map<number, number>();

    this.obstacles.forEach((obstacle) => {
      const lane = obstacle.userData.lane;
      byLane.set(lane, (byLane.get(lane) || 0) + 1);
    });

    return {
      total: this.obstacles.length,
      byLane,
    };
  }
}

// // Создаем и экспортируем синглтон для удобства
// export const obstacleManager = ObstacleManager.getInstance();

// // Для обратной совместимости экспортируем также функции
// export const obstacles = obstacleManager.getObstacles();
// export const spawnObstacleRow = (
//   laneIndex: number,
//   zPos: number = -60,
//   variant: number | null = null,
// ) => obstacleManager.spawnObstacleRow(laneIndex, zPos, variant);
// export const updateObstacles = (speed: number) => obstacleManager.update(speed);
// export const resetObstacles = () => obstacleManager.reset();
// export const spawnObstaclePattern = (
//   zPos: number = -60,
//   pattern: "wall" | "zigzag" | "random" = "random",
// ) => obstacleManager.spawnObstaclePattern({ zPos, pattern });
