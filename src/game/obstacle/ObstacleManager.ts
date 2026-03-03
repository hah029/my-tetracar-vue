import { Jump } from "./Jump";
import { Obstacle } from "./Obstacle";
import { OBSTACLE_FORMS } from "./config/ObstacleCubesConfig";
import * as THREE from "three";

export class ObstacleManager {
  private static instance: ObstacleManager | null = null;
  private obstacles: Obstacle[] = [];
  private jumps: Jump[] = [];
  private dynamicCubes: THREE.Object3D[] = []; // отдельный массив для кубиков разрушенных препятствий
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

  public registerDynamicCubes(cubes: THREE.Object3D[]) {
    this.dynamicCubes.push(...cubes);
  }

  public spawnObstacle(
    lane: number,
    z = -60,
    formIndex?: number,
  ): Obstacle | null {
    const index =
      formIndex !== undefined
        ? formIndex
        : Math.floor(Math.random() * OBSTACLE_FORMS.length);
    const form = OBSTACLE_FORMS[index];
    if (!form) {
      console.warn(`Form with index ${index} not found`);
      return null;
    }
    const obstacle = new Obstacle(lane, z, form, this.scene, this.useGLB);
    this.obstacles.push(obstacle);
    this.scene.add(obstacle);
    return obstacle;
  }

  public spawnJump(lane: number, z = -60): Jump | null {
    const jump = new Jump(lane, this.scene, z);
    this.jumps.push(jump);
    return jump;
  }

  public update(speed: number) {
    // this.updateList(this.obstacles, speed);
    this.updateObstacles(speed);
    this.updateList(this.jumps, speed);
  }

  private updateObstacles(speed: number) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      if (obstacle === undefined) continue;
      const shouldRemove = obstacle.update(speed);

      if (shouldRemove && obstacle.isFullyDestroyed()) {
        this.scene.remove(obstacle);
        this.obstacles.splice(i, 1);
      }
    }
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

    // Удаляем все динамические кубики
    this.dynamicCubes.forEach((cube) => this.scene.remove(cube));
    this.dynamicCubes = [];
  }
}
