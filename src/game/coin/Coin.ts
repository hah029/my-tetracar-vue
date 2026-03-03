// src/game/coin/Coin.ts
import * as THREE from "three";
import { type CoinConfig } from "./types";
import { RoadManager } from "@/game/road/RoadManager";
import { DEFAULT_COIN_CONFIG } from "./config"
import { loadTexture } from "@/helpers/loaders";

export class Coin extends THREE.Mesh {
  private cubeModelCache: THREE.Group | null = null;
  public collider: THREE.Sphere;
  public value: number;

  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 10,
    config?: CoinConfig,
  ) {

    let tmpConfig = { ...DEFAULT_COIN_CONFIG, ...config }
    const geometry = new THREE.BoxGeometry(tmpConfig.x, tmpConfig.y, tmpConfig.z);
    let material: THREE.Material;

    if (tmpConfig.textureUrl) {
      const texture = loadTexture(tmpConfig.textureUrl);
      material = new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xffd700,
        emissive: 0xaa8800,
        emissiveIntensity: 1.2,
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xaa8800,
        emissiveIntensity: 1.2,
      });
    }


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
