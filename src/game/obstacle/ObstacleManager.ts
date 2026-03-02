import { Jump } from "./Jump";
import { Obstacle } from "./Obstacle";
import { ObstacleFromCubes } from "./ObstacleFromCubes";
import { OBSTACLE_FORMS } from "./config/ObstacleCubesConfig";
import * as THREE from "three";

export class ObstacleManager {
  private static instance: ObstacleManager | null = null;
  private obstacles: Obstacle[] = [];
  private obstaclesFromCubes: ObstacleFromCubes[] = [];
  private jumps: Jump[] = [];
  private dynamicCubes: THREE.Object3D[] = []; // отдельный массив для кубиков разрушенных препятствий
  private scene!: THREE.Scene;
  private useGLB: boolean = false;
  private cubeModelUrl: string = "";

  public static getInstance(): ObstacleManager {
    if (!ObstacleManager.instance) {
      ObstacleManager.instance = new ObstacleManager();
    }
    return ObstacleManager.instance;
  }

  public initialize(
    scene: THREE.Scene,
    useGLB: boolean = false,
    cubeModelUrl: string = "",
  ) {
    this.scene = scene;
    this.useGLB = useGLB;
    this.cubeModelUrl = cubeModelUrl;
  }

  public registerDynamicCubes(cubes: THREE.Object3D[]) {
    this.dynamicCubes.push(...cubes);
  }

  public spawnObstacle(lane: number, z = -60): Obstacle | null {
    const obstacle = new Obstacle(lane, this.scene, z);
    this.obstacles.push(obstacle);
    return obstacle;
  }

  public spawnObstacleFromCubes(
    lane: number,
    z = -60,
    formIndex?: number,
  ): ObstacleFromCubes | null {
    const index =
      formIndex !== undefined
        ? formIndex
        : Math.floor(Math.random() * OBSTACLE_FORMS.length);
    const form = OBSTACLE_FORMS[index];
    if (!form) {
      console.warn(`Form with index ${index} not found`);
      return null;
    }
    const obstacle = new ObstacleFromCubes(
      lane,
      z,
      form,
      this.scene,
      this.useGLB,
      this.cubeModelUrl,
    );
    this.obstaclesFromCubes.push(obstacle);
    this.scene.add(obstacle);
    return obstacle;
  }

  public spawnJump(lane: number, z = -60): Jump | null {
    const jump = new Jump(lane, this.scene, z);
    this.jumps.push(jump);
    return jump;
  }

  public update(speed: number) {
    this.updateList(this.obstacles, speed);
    this.updateObstaclesFromCubes(speed);
    this.updateList(this.jumps, speed);
  }

  private updateObstaclesFromCubes(speed: number) {
    for (let i = this.obstaclesFromCubes.length - 1; i >= 0; i--) {
      const obstacle = this.obstaclesFromCubes[i];
      if (obstacle === undefined) continue;
      const shouldRemove = obstacle.update(speed);

      if (shouldRemove && obstacle.isFullyDestroyed()) {
        this.scene.remove(obstacle);
        this.obstaclesFromCubes.splice(i, 1);
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

  public getObstaclesFromCubes() {
    return this.obstaclesFromCubes;
  }

  public getJumps() {
    return this.jumps;
  }

  public reset() {
    // Удаляем все обычные объекты
    [...this.obstacles, ...this.obstaclesFromCubes, ...this.jumps].forEach(
      (o) => this.scene.remove(o),
    );
    this.obstacles = [];
    this.obstaclesFromCubes = [];
    this.jumps = [];

    // Удаляем все динамические кубики
    this.dynamicCubes.forEach((cube) => this.scene.remove(cube));
    this.dynamicCubes = [];
  }
}
