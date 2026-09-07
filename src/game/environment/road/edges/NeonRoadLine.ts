import * as THREE from "three";

/** Thin HDR line rendered above a road edge purely for the neon outline. */
export class NeonRoadLine extends THREE.Mesh {
  constructor(x: number, depth: number, color: number) {
    const geometry = new THREE.BoxGeometry(0.12, 0.055, depth);
    const neonColor = new THREE.Color(color).multiplyScalar(3);
    const material = new THREE.MeshBasicMaterial({ color: neonColor, toneMapped: false });
    super(geometry, material);
    this.position.set(x, 0.08, 10);
  }
}
