import * as THREE from "three";
import type { RoadLineConfig } from "./types";

export class RoadLine extends THREE.Mesh {
  constructor(config: RoadLineConfig) {
    const {
      x,
      z,
      color = 0x888888,
      emissive = color,
      emissiveIntensity = 1,
      opacity = 1,
      length = 800,
    } = config;

    const geometry = new THREE.BoxGeometry(0.1, 0.1, length);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      side: THREE.DoubleSide,
      transparent: opacity < 1,
      opacity,
    });

    super(geometry, material);

    this.position.set(x, 0.01, z + 30);
  }
}
