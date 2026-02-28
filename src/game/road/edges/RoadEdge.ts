import * as THREE from "three";

export class RoadEdge extends THREE.Line {
  constructor(x: number, color: number = 0x00ffff) {
    const points = [
      new THREE.Vector3(x, 0.02, -90),
      new THREE.Vector3(x, 0.02, 110),
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });

    super(geometry, material);
  }
}
