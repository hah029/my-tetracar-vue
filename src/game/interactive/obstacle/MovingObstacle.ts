import * as THREE from "three";

import type { GeometryConfig } from "@/game/cube/types";
import { RoadManager } from "@/game/road/RoadManager";

import { CubeObstacle } from "./CubeObstacle";

export class MovingObstacle extends CubeObstacle {
  private speedX = 0.005;
  private direction: 1 | -1;
  private minX: number;
  private maxX: number;

  constructor(
    startLane: number,
    width: number,
    zPos: number,
    lanes: number,
    scene: THREE.Scene,
    useGLB = false,
    direction: 1 | -1 = 1,
    formConfig: GeometryConfig[],
  ) {
    super(startLane, zPos, formConfig, scene, useGLB);

    const road = RoadManager.getInstance();

    this.minX = road.getLanePosition(0);
    this.maxX = road.getLanePosition(lanes - width);
    this.direction = direction;
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

  public getLane(): number {
    const road = RoadManager.getInstance();
    const lanePositions = road.getLanes();
    if (lanePositions.length === 0) {
      return 0; // fallback
    }
    let closestIndex = 0;
    let minDistance = Math.abs(this.position.x - lanePositions[0]!);
    for (let i = 1; i < lanePositions.length; i++) {
      const distance = Math.abs(this.position.x - lanePositions[i]!);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    return closestIndex;
  }
}
