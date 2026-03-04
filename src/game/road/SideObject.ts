import * as THREE from "three";
import { CubeBuilder } from "../cube/Cube";
import { SIDE_OBJECT_GEOMETRY_CONFIG } from "./config/SideObjectConfig";

export class SideObject extends THREE.Group {
  private cube: THREE.Object3D = new THREE.Object3D();
  private isBuilt: boolean = false;

  constructor(xPos: number, yPos: number, zPos: number) {
    super();
    this.build(xPos, yPos, zPos).catch((err) => {
      console.error("[SideObject] build failed:", err);
    });
  }

  async build(xPos: number, yPos: number, zPos: number): Promise<void> {
    try {
      this.cube = await CubeBuilder.build({
        useGLB: true,
        geomConfig: SIDE_OBJECT_GEOMETRY_CONFIG,
      });
      this.cube.position.set(xPos, yPos, zPos);
      this.add(this.cube);
      this.isBuilt = true;
    } catch (error) {
      console.error("[SideObject] build error:", error);
      throw error;
    }
  }

  public update(speed: number, spacing: number, objects: SideObject[]): void {
    if (!this.isBuilt) return;

    this.cube.position.z += speed;

    if (this.cube.position.z > 10) {
      let minZ = Infinity;
      for (const obj of objects) {
        if (obj.cube.position.z < minZ) {
          minZ = obj.cube.position.z;
        }
      }
      this.cube.position.z = minZ - spacing;
    }
  }

  public setPosition(x: number, z: number): void {
    if (!this.isBuilt) return;
    this.cube.position.x = x;
    this.cube.position.z = z;
  }
}
