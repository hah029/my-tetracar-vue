// src/game/coin/Coin.ts
import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";
import { COIN_GEOMETRY_CONFIG, COIN_MATERIAL_CONFIG } from "./config";

import { CubeBuilder } from "@/game/cube/Cube";

export class Coin extends THREE.Group {
  public collider: THREE.Sphere;
  private cube: THREE.Object3D = new THREE.Object3D();
  public value: number;
  private rotationYDiff = 0.05;
  private initialPosition: THREE.Vector3;

  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 10,
  ) {
    super();
    const x = RoadManager.getInstance().getLanePosition(laneIndex);
    this.initialPosition = new THREE.Vector3(x, yPos, zPos);
    this.cube.position.copy(this.initialPosition);
    this.collider = new THREE.Sphere(this.initialPosition.clone(), 0.45);
    this.value = value;
    this.build().catch((err) => {
      console.error("[Coin] build failed:", err);
    });
  }

  async build(): Promise<void> {
    try {
      this.cube = await CubeBuilder.build({
        useGLB: true,
        geomConfig: COIN_GEOMETRY_CONFIG,
        useTexture: true,
        materialConfig: COIN_MATERIAL_CONFIG,
      });
      this.cube.position.copy(this.initialPosition);
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
