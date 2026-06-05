import * as THREE from "three";
import type { RoadLineConfig } from "./types";

export class RoadLine extends THREE.Mesh {
  constructor(config: RoadLineConfig) {
    const { x, z, color = 0x888888, length = 800 } = config;

    const geometry = new THREE.BoxGeometry(0.1, 0.1, length);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: 0x888888,
      emissiveIntensity: 2,
      side: THREE.DoubleSide,
      // transparent: true,
      // opacity: 0.25,
    });

    super(geometry, material);

    this.position.set(x, 0.01, z + 30);
  }
}
