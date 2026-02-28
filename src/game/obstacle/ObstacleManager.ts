// src/composables/ObstacleManager.ts
import * as THREE from "three";
import { Obstacle } from "./Obstacle";
import { Jump } from "./Jump";
import { RoadManager } from "@/game/road/RoadManager";
import type { ObstaclePatternOptions } from "./types";

export class ObstacleManager {
  private static instance: ObstacleManager;
  private obstacles: Obstacle[] = [];
  private jumps: Jump[] = [];
  private scene: THREE.Scene = new THREE.Scene();

  private spawnTimer: number = 0;
  private lastSpawnTime: number = 0;
  private baseSpawnInterval: number = 500; // мс

  private jumpChance: number = 0.02; // шанс на трамплин перед препятствием
  private jumpDistanceMin: number = 2;
  private jumpDistanceMax: number = 8;
  private speedForMaxJump: number = 3;

  private constructor() {}

  public static getInstance(): ObstacleManager {
    if (!ObstacleManager.instance) {
      ObstacleManager.instance = new ObstacleManager();
    }
    return ObstacleManager.instance;
  }

  public initialize(scene: THREE.Scene): void {
    if (!scene) throw new Error("scene is null");
    this.scene = scene;
  }

  // ==========================
  // Публичные методы для спавна
  // ==========================
  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  public getJumps(): Jump[] {
    return this.jumps;
  }

  public spawnObstacle(
    laneIndex: number,
    zPos: number = -60,
    variant: number | null = null,
  ): Obstacle | null {
    const lanesCount = this.getLanesCount();
    if (laneIndex < 0 || laneIndex >= lanesCount) return null;

    if (
      this.obstacles.some(
        (o) =>
          Math.abs(o.position.z - zPos) < 0.1 && o.userData.lane === laneIndex,
      )
    )
      return null;

    try {
      const obstacle = new Obstacle(laneIndex, this.scene, zPos, variant);
      this.obstacles.push(obstacle);
      return obstacle;
    } catch (e) {
      console.error("Failed to spawn obstacle:", e);
      return null;
    }
  }

  public spawnJump(laneIndex: number, zPos: number = -60): Jump | null {
    const lanesCount = this.getLanesCount();
    if (laneIndex < 0 || laneIndex >= lanesCount) return null;

    try {
      const jump = new Jump(laneIndex, this.scene, zPos);
      this.jumps.push(jump);
      return jump;
    } catch (e) {
      console.error("Failed to spawn jump:", e);
      return null;
    }
  }

  public spawnObstacleRow(
    laneIndex: number,
    zPos: number = -60,
    variant: number | null = null,
  ): Obstacle | null {
    return this.spawnObstacle(laneIndex, zPos, variant);
  }

  public spawnObstaclePattern(
    options: ObstaclePatternOptions = {},
  ): Obstacle[] {
    const { zPos = -60, pattern = "random", count, spacing = 4 } = options;
    const spawned: Obstacle[] = [];
    const lanesCount = this.getLanesCount();

    switch (pattern) {
      case "wall":
        for (let i = 0; i < lanesCount; i++) {
          const obstacle = this.spawnObstacle(i, zPos, i);
          if (obstacle) spawned.push(obstacle);
        }
        break;

      case "zigzag":
        for (let i = 0; i < lanesCount; i++) {
          const obstacle = this.spawnObstacle(i, zPos - i * spacing, i);
          if (obstacle) spawned.push(obstacle);
        }
        break;

      case "random":
      default:
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

  // ==========================
  // Обновление
  // ==========================
  public update(deltaTime: number, speed: number): void {
    this.spawnTimer += deltaTime;

    // динамический интервал
    const spawnInterval = Math.max(300, this.baseSpawnInterval - speed * 5);

    if (this.spawnTimer - this.lastSpawnTime >= spawnInterval) {
      const lanesCount = this.getLanesCount();
      const emptyLane = Math.floor(Math.random() * lanesCount);

      for (let lane = 0; lane < lanesCount; lane++) {
        if (lane === emptyLane) continue;

        // 10% шанс на трамплин перед препятствием
        if (Math.random() < this.jumpChance) {
          const jumpDistance = this.getJumpDistance(speed);
          this.spawnJump(lane, -60 + jumpDistance);
        }

        // // 5% шанс на паттерн, иначе обычный препятствие
        // if (Math.random() < 0.02) {
        //   this.spawnObstaclePattern({ pattern: "random", zPos: -60 });
        // } else {
        // }
        this.spawnObstacleRow(lane, -60);
      }

      this.lastSpawnTime = this.spawnTimer;
    }

    // Обновление препятствий
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs === undefined) continue;
      if (obs.update(speed)) {
        this.scene.remove(obs);
        this.obstacles.splice(i, 1);
      }
    }

    // Обновление трамплинов
    for (let i = this.jumps.length - 1; i >= 0; i--) {
      const jump = this.jumps[i];
      if (jump === undefined) continue;
      if (jump.update(speed)) {
        this.scene.remove(jump);
        this.jumps.splice(i, 1);
      }
    }
  }

  public reset(): void {
    this.obstacles.forEach((o) => this.scene.remove(o));
    this.jumps.forEach((j) => this.scene.remove(j));
    this.obstacles = [];
    this.jumps = [];
    this.spawnTimer = 0;
    this.lastSpawnTime = 0;
  }

  public getObstaclesInRange(zMin: number, zMax: number): Obstacle[] {
    return this.obstacles.filter(
      (o) => o.position.z >= zMin && o.position.z <= zMax,
    );
  }

  public checkCollision(box: THREE.Box3): Obstacle | null {
    for (const obs of this.obstacles) {
      if (box.intersectsBox(obs.getBoundingBox())) return obs;
    }
    return null;
  }

  public removeObstacle(obstacle: Obstacle): void {
    const idx = this.obstacles.indexOf(obstacle);
    if (idx !== -1) {
      this.scene.remove(obstacle);
      this.obstacles.splice(idx, 1);
    }
  }

  public getCount(): number {
    return this.obstacles.length;
  }

  public getStats(): { total: number; byLane: Map<number, number> } {
    const byLane = new Map<number, number>();
    this.obstacles.forEach((obs) => {
      const lane = obs.userData.lane;
      byLane.set(lane, (byLane.get(lane) || 0) + 1);
    });
    return { total: this.obstacles.length, byLane };
  }

  // ==========================
  // Вспомогательные методы
  // ==========================
  private getLanesCount(): number {
    try {
      return RoadManager.getInstance().getLanesCount();
    } catch {
      return 4;
    }
  }

  private getJumpDistance(speed: number): number {
    const factor = Math.min(speed / this.speedForMaxJump, 1);
    return (
      this.jumpDistanceMin +
      (this.jumpDistanceMax - this.jumpDistanceMin) * factor
    );
  }
}
