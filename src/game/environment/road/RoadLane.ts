import * as THREE from "three";
import type { RoadLaneConfig } from "./types";

export class RoadLane extends THREE.Mesh {
  constructor(config: RoadLaneConfig) {
    const { x, z, color = 0xffffff, length = 800, width = 1 } = config;

    const geometry = new THREE.BoxGeometry(width * 0.9, 0.1, length);
    const material = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.4,
      visible: true,
    });

    super(geometry, material);

    this.position.set(x, 0.01, z + 30);

    this.castShadow = false;
    this.receiveShadow = true;
  }
}
