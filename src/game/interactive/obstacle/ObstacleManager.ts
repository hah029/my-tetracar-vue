import * as THREE from "three";
import { CAR_CUBES_CONFIG } from "@/game/car";
import { RoadManager } from "@/game/road/RoadManager";

import { OBSTACLE_FORMS } from "./config/ObstacleCubesConfig";
import { BaseObstacle } from "./BaseObstacle";
import { MovingObstacle } from "./MovingObstacle";
import { StaticObstacle } from "./StaticObstacle";
import { EnemyCar } from "./EnemyCar";
import { Jump } from "./Jump";

export class ObstacleManager {
  private static instance: ObstacleManager | null = null;
  private obstacles: BaseObstacle[] = [];
  private jumps: Jump[] = [];
  private scene!: THREE.Scene;
  private useGLB: boolean = false;

  public static getInstance(): ObstacleManager {
    if (!ObstacleManager.instance) {
      ObstacleManager.instance = new ObstacleManager();
    }
    return ObstacleManager.instance;
  }

  public initialize(scene: THREE.Scene, useGLB: boolean = false) {
    this.scene = scene;
    this.useGLB = useGLB;
  }

  public spawnStaticObstacle(
    lane: number,
    z = -60,
    formIndex?: number,
  ): StaticObstacle | null {
    const index =
      formIndex !== undefined ? formIndex : this.getRandomObstacleIndex();
    const form = OBSTACLE_FORMS[index];
    if (!form) {
      return null;
    }
    const obstacle = new StaticObstacle(lane, z, form, this.scene, this.useGLB);
    this.obstacles.push(obstacle);
    this.scene.add(obstacle);
    return obstacle;
  }

  private getRandomObstacleIndex(): number {
    return Math.floor(Math.random() * OBSTACLE_FORMS.length);
  }

  public spawnMovingObstacle(
    startLane: number,
    width: number,
    z = -60,
    formIndex?: number,
  ) {
    const lanes = RoadManager.getInstance().getLanesCount();
    const index =
      formIndex !== undefined ? formIndex : this.getRandomObstacleIndex();
    const form = OBSTACLE_FORMS[index];
    if (!form) {
      return;
    }
    const obstacle = new MovingObstacle(
      startLane,
      width,
      z,
      lanes,
      this.scene,
      this.useGLB,
      form,
    );

    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
  }

  public spawnEnemyCar(lane: number, z = -60) {
    const form = CAR_CUBES_CONFIG;
    const obstacle = new EnemyCar(lane, z, form, this.scene, true);
    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
  }

  public spawnJump(lane: number, z = -60): Jump | null {
    const jump = new Jump(lane, this.scene, z);
    this.jumps.push(jump);
    return jump;
  }

  public update(dt: number, speed: number) {
    this.updateList(this.obstacles, dt, speed);
    this.updateList(this.jumps, dt, speed);
    // this.updateDestroyedCubes(dt, speed);
  }

  private updateList<T extends { update(dt: number, s: number): boolean }>(
    list: T[],
    deltaTime: number,
    speed: number,
  ) {
    for (let i = list.length - 1; i >= 0; i--) {
      const obj = list[i];
      if (obj === undefined) continue;
      if (obj.update(deltaTime, speed)) {
        this.scene.remove(obj as any);
        list.splice(i, 1);
      }
    }
  }

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

    // // Удаляем все динамические кубики
    // this.destroyedCubes.forEach((cube) => this.scene.remove(cube));
    // this.destroyedCubes = [];
  }
}
