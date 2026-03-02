import * as THREE from "three";
import type { RoadLineConfig } from "./types";

export class RoadLine extends THREE.Mesh {
  private readonly resetZ: number;
  private readonly length: number;

  constructor(config: RoadLineConfig) {
    const { x, z, length = 250, color = 0x000000, opacity = 0.9 } = config;

    const geometry = new THREE.BoxGeometry(0.05, 0.02, length);
    const material = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.6,
    });

    super(geometry, material);

    this.length = length;
    this.resetZ = z - length;

    this.position.set(x, 0.06, z + 10);
    this.castShadow = false;
    this.receiveShadow = false;
    this.frustumCulled = true; // ✅ важно
  }

  public update(speed: number): void {
    // this.position.z += speed;
    // if (this.position.z > this.length * 0.5) {
    //   this.position.z = this.resetZ;
    // }
  }
}
