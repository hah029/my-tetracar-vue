// src/game/coin/Coin.ts
import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";

import { CubeBuilder } from "@/game/cube/Cube";
import type { MaterialConfig } from "@/game/cube/types";
import { ITEM_GEOMETRY_CONFIG } from "./BaseConfig";
import { useCommonStore } from "@/store/commonStore";

export class BaseItem extends THREE.Group {
  public collider: THREE.Sphere;
  public itemType!: string;
  protected cube: THREE.Object3D = new THREE.Object3D();
  protected rotationYDiff = useCommonStore().BASE_ITEM_ROTATION;
  protected initialPosition: THREE.Vector3;

  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = useCommonStore().BASE_ITEM_YPOS,
    material: MaterialConfig | null = null,
  ) {
    super();
    this.userData = { isInteractiveItem: true };
    const x = RoadManager.getInstance().getLanePosition(laneIndex);
    this.initialPosition = new THREE.Vector3(x, yPos, zPos);
    this.position.copy(this.initialPosition);
    this.cube.position.set(0, 0, 0);
    this.collider = new THREE.Sphere(this.position.clone(), 0.45);
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
      this.cube.position.set(0, 0, 0);
      this.add(this.cube);
    } catch (error) {
      console.error("[Coin] build error:", error);
      throw error;
    }
  }

  update(deltaTime: number, speed: number): boolean {
    this.position.z += deltaTime * speed;
    this.cube.rotation.y += this.rotationYDiff;
    this.collider.center.copy(this.position);
    return this.position.z > useCommonStore().ITEMS_REMOVING_ZPOS;
  }
}
