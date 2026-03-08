import * as THREE from "three";

import { RoadManager } from "../road/RoadManager";
import { CubeObstacle } from "./CubeObstacle";
import type { GeometryConfig } from "../cube/types";

export class DynamicObstacle extends CubeObstacle {
  private direction = 1;
  private speedX = 2;
  private minX: number;
  private maxX: number;

  constructor(
    startLane: number,
    width: number,
    zPos: number,
    lanes: number,
    scene: THREE.Scene,
    useGLB = false,
    formConfig: GeometryConfig[],
  ) {
    super(startLane, zPos, formConfig, scene, useGLB);

    this.minX = RoadManager.getInstance().getLanePosition(0);
    this.maxX = RoadManager.getInstance().getLanePosition(lanes - width);
  }

  protected updateNormalCubes(dt: number, speed: number) {
    this.position.z += dt * speed;
    // горизонтальное движение
    this.position.x += this.direction * this.speedX * dt;
    if (this.position.x < this.minX) {
      this.direction = 1;
    }
    if (this.position.x > this.maxX) {
      this.direction = -1;
    }
  }
}
