// src/game/coin/Coin.ts
import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";

import { CubeBuilder } from "@/game/cube/Cube";
import type { MaterialConfig } from "@/game/cube/types";
import { ITEM_GEOMETRY_CONFIG } from "./BaseConfig";

export class BaseItem extends THREE.Group {
  public collider: THREE.Sphere;
  public itemType!: string;
  protected cube: THREE.Object3D = new THREE.Object3D();
  protected rotationYDiff = 0.05;
  protected initialPosition: THREE.Vector3;

  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    material: MaterialConfig | null = null,
  ) {
    super();
    const x = RoadManager.getInstance().getLanePosition(laneIndex);
    this.initialPosition = new THREE.Vector3(x, yPos, zPos);
    this.cube.position.copy(this.initialPosition);
    this.collider = new THREE.Sphere(this.initialPosition.clone(), 0.45);
    this.build(material).catch((err) => {
      console.error("[Coin] build failed:", err);
    });
  }

  async build(material: MaterialConfig | null = null): Promise<void> {
    const config = {
      useGLB: true,
      geomConfig: ITEM_GEOMETRY_CONFIG,
      useTexture: material != null,
      materialConfig: material != null ? material : undefined,
    };

    try {
      this.cube = await CubeBuilder.build(config);
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
