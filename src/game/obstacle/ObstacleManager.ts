import { Jump } from "./Jump";
import { Obstacle } from "./Obstacle";

import * as THREE from "three";

// src/game/obstacle/ObstacleManager.ts
export class ObstacleManager {
  private static instance: ObstacleManager | null = null;
  private obstacles: Obstacle[] = [];
  private jumps: Jump[] = [];
  private scene!: THREE.Scene;

  public static getInstance(): ObstacleManager {
    if (!ObstacleManager.instance) {
      ObstacleManager.instance = new ObstacleManager();
    }
    return ObstacleManager.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  // === SPAWN ===
  public spawnObstacle(lane: number, z = -60): Obstacle | null {
    const obstacle = new Obstacle(lane, this.scene, z);
    this.obstacles.push(obstacle);
    return obstacle;
  }

  public spawnJump(lane: number, z = -60): Jump | null {
    const jump = new Jump(lane, this.scene, z);
    this.jumps.push(jump);
    return jump;
  }

  // === UPDATE ===
  public update(speed: number) {
    this.updateList(this.obstacles, speed);
    this.updateList(this.jumps, speed);
  }

  private updateList<T extends { update(s: number): boolean }>(
    list: T[],
    speed: number,
  ) {
    for (let i = list.length - 1; i >= 0; i--) {
      const obj = list[i];
      if (obj === undefined) continue;
      if (obj.update(speed)) {
        this.scene.remove(obj as any);
        list.splice(i, 1);
      }
    }
  }

  // === GETTERS ===
  public getObstacles() {
    return this.obstacles;
  }

  public getJumps() {
    return this.jumps;
  }

  public reset() {
    [...this.obstacles, ...this.jumps].forEach((o) => this.scene.remove(o));
    this.obstacles = [];
    this.jumps = [];
  }
}
