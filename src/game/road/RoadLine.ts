import * as THREE from "three";
import type { RoadLineConfig } from "./types";

export class RoadLine extends THREE.Mesh {
  constructor(config: RoadLineConfig) {
    const { x, z, color = 0xffffff } = config;

    const geometry = new THREE.BoxGeometry(1, 1, length);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.6,
    });

    super(geometry, material);

    this.position.set(x, 1, z + 10);
    this.castShadow = false;
    this.receiveShadow = false;
    this.frustumCulled = true;

    console.log("line created");
  }
}
