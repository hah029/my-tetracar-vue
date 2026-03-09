// src/game/coin/Coin.ts
import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";
import { COIN_GEOMETRY_CONFIG, COIN_MATERIAL_CONFIG } from "./config";

import { CubeBuilder } from "@/game/cube/Cube";

export class Coin extends THREE.Group {
  public collider: THREE.Sphere = new THREE.Sphere();
  private cube: THREE.Object3D = new THREE.Object3D();
  public value: number;
  private rotationYDiff = 0.05;

  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 10,
  ) {
    super();
    this.build(laneIndex, zPos, yPos).catch((err) => {
      console.error("[Coin] build failed:", err);
    });
    this.value = value;
  }

  async build(laneIndex: number, zPos: number, yPos: number): Promise<void> {
    try {
      this.cube = await CubeBuilder.build({
        useGLB: true,
        geomConfig: COIN_GEOMETRY_CONFIG,
        useTexture: true,
        materialConfig: COIN_MATERIAL_CONFIG,
      });
      const x = RoadManager.getInstance().getLanePosition(laneIndex);
      this.cube.position.set(x, yPos, zPos);
      this.collider = new THREE.Sphere(this.cube.position, 0.45);
      this.add(this.cube);
    } catch (error) {
      console.error("[Coin] build error:", error);
      throw error;
    }
  }

  update(deltaTime: number, speed: number): boolean {
    this.cube.position.z += deltaTime * speed;
    this.cube.rotation.y += this.rotationYDiff;
    this.collider.center.copy(this.cube.position);
    return this.cube.position.z > 10;
  }
}
