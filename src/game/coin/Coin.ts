// src/game/coin/Coin.ts
import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";

export class Coin extends THREE.Mesh {
  public collider: THREE.Sphere;
  public value: number;

  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 10,
  ) {
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xaa8800,
      emissiveIntensity: 1.2,
    });

    super(geometry, material);

    const road = RoadManager.getInstance();
    const x = road.getLanePosition(laneIndex);

    this.position.set(x, yPos, zPos);
    this.value = value;

    this.collider = new THREE.Sphere(this.position, 0.45);
  }

  update(speed: number): boolean {
    this.position.z += speed;
    this.rotation.y += 0.05;

    this.collider.center.copy(this.position);

    return this.position.z > 10;
  }
}
