import * as THREE from "three";

export class NeonEdge extends THREE.Line {
  constructor(x: number, color: number = 0x44ffff) {
    const points: THREE.Vector3[] = [];
    for (let z = -90; z <= 110; z += 2) {
      points.push(new THREE.Vector3(x + Math.sin(z * 0.1) * 0.2, 0.05, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });

    super(geometry, material);
  }
}