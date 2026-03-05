// src/game/coin/Coin.ts
import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";
import { NITRO_GEOMETRY_CONFIG, NITRO_MATERIAL_CONFIG } from "./config/NitroConfig";

import { CubeBuilder } from "../cube/Cube";

export class Nitro extends THREE.Group {
  public collider: THREE.Sphere = new THREE.Sphere();
  private cube: THREE.Object3D = new THREE.Object3D();

  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
  ) {
    super();
    this.build(laneIndex, zPos, yPos).catch((err) => {
      console.error("[Nitro booster] build failed:", err);
    });
  }

  async build(laneIndex: number, zPos: number, yPos: number): Promise<void> {
    try {
      this.cube = await CubeBuilder.build({
        useGLB: true,
        geomConfig: NITRO_GEOMETRY_CONFIG,
        useTexture: true,
        materialConfig: NITRO_MATERIAL_CONFIG,
      });
      const x = RoadManager.getInstance().getLanePosition(laneIndex);
      this.cube.position.set(x, yPos, zPos);
      this.collider = new THREE.Sphere(this.cube.position, 0.45);
      this.add(this.cube);
    } catch (error) {
      console.error("[Nitro booster] build error:", error);
      throw error;
    }
  }

  update(speed: number): boolean {
    this.cube.position.z += speed;
    this.cube.rotation.y += 0.05;

    this.collider.center.copy(this.cube.position);

    return this.cube.position.z > 10;
  }
}
