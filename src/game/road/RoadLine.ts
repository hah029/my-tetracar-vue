import * as THREE from "three";
import type { RoadLineConfig } from "./types";

export class RoadLine extends THREE.Mesh {
  constructor(config: RoadLineConfig) {
    const { x, z, color = 0xbbbbbb, length = 250 } = config;

    const geometry = new THREE.BoxGeometry(0.01, 0.01, length);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: 0xffffff,
      emissiveIntensity: 1.0,
      side: THREE.DoubleSide,
    });

    super(geometry, material);

    this.position.set(x, 0.01, z + 10);
  }
}
