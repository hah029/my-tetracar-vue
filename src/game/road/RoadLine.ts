import * as THREE from "three";
import { type RoadLineConfig } from "./types";

export class RoadLine extends THREE.Mesh {
  private segmentLength: number;
  private gap: number;
  private totalLength: number;

  constructor(config: RoadLineConfig) {
    const {
      x,
      z,
      segmentLength = 1.5,
      gap = 1.5,
      color = 0x44ffff,
      emissive = 0x226688,
      opacity = 0.9,
    } = config;

    const geometry = new THREE.BoxGeometry(0.1, 0.02, segmentLength);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity,
    });

    super(geometry, material);

    this.segmentLength = segmentLength;
    this.gap = gap;
    this.totalLength = 200;

    this.position.set(x, 0.06, z);
    this.castShadow = false;
    this.receiveShadow = false;
  }

  public update(speed: number): void {
    this.position.z += speed;

    if (this.position.z > 50) {
      const totalSegments =
        Math.ceil(this.totalLength / (this.segmentLength + this.gap)) + 10;
      this.position.z -= totalSegments * (this.segmentLength + this.gap);

      if ((this.material as THREE.MeshStandardMaterial).emissive) {
        const material = this.material as THREE.MeshStandardMaterial;
        const hue = Math.random() * 0.2 + 0.5;
        material.emissive.setHSL(hue, 1, 0.3);
      }
    }
  }
}
