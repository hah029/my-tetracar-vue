import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";

import { BaseObstacle } from "./BaseObstacle";
import { MovingObstacle } from "./MovingObstacle";
import { StaticObstacle } from "./StaticObstacle";
import { EnemyCar } from "./EnemyCar";
import { Jump } from "./Jump";
import { useCommonStore } from "@/store/commonStore";
import { usePlayerStore } from "@/store/playerStore";
import { TEXTURES } from "@/assets/textures";

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
    z = useCommonStore().BASE_SEGMENTS_ZPOS,
    formIndex?: number,
  ): StaticObstacle | null {
    const index =
      formIndex !== undefined ? formIndex : this.getRandomObstacleIndex();

    let obstacle: StaticObstacle;

    const formBase = useCommonStore().OPTIMIZED_OBSTACLE_FORMS[index];
    if (!formBase) {
      return null;
    }
    const formDetailed = useCommonStore().FULL_OBSTACLE_FORMS[index];
    obstacle = new StaticObstacle(
      lane,
      z,
      formBase,
      this.scene,
      this.useGLB,
      undefined,
      formDetailed,
      { textureUrl: TEXTURES.cube.obstacle3x3 },
    );

    this.obstacles.push(obstacle);
    this.scene.add(obstacle);
    return obstacle;
  }

  private getRandomObstacleIndex(): number {
    return Math.floor(
      Math.random() * useCommonStore().OPTIMIZED_OBSTACLE_FORMS.length,
    );
  }

  public spawnMovingObstacle(
    startLane: number,
    z = useCommonStore().BASE_SEGMENTS_ZPOS,
    width = 1,
    formIndex?: number,
  ) {
    const lanes = RoadManager.getInstance().getLanesCount();
    const index =
      formIndex !== undefined ? formIndex : this.getRandomObstacleIndex();
    const form = useCommonStore().OPTIMIZED_OBSTACLE_FORMS[index];
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
      Math.random() > 0.5 ? 1 : -1, // direction
      form,
      { textureUrl: TEXTURES.cube.obstacle3x3 },
    );

    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
  }

  public spawnEnemyCar(lane: number, z = useCommonStore().BASE_SEGMENTS_ZPOS) {
    const form = usePlayerStore().CAR_CUBES_CONFIG;
    const obstacle = new EnemyCar(
      lane,
      z,
      form,
      this.scene,
      true,
      undefined,
      undefined,
      { textureUrl: TEXTURES.cube.base },
    );
    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
  }

  public spawnJump(
    lane: number,
    z = useCommonStore().BASE_SEGMENTS_ZPOS,
  ): Jump | null {
    const jump = new Jump(lane, this.scene, z);
    this.jumps.push(jump);
    return jump;
  }

  public update(dt: number, speed: number) {
    this.updateList(this.obstacles, dt, speed);
    this.updateList(this.jumps, dt, speed);
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

  public getObstaclesCount() {
    return this.obstacles.length;
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
