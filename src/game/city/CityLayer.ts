import * as THREE from "three";
import { CityBuilding } from "./CityBuilding";
import type { CityLayerConfig } from "./types";

export class CityLayer {
  private buildings: CityBuilding[] = [];
  private config: CityLayerConfig;

  constructor(scene: THREE.Scene, config: CityLayerConfig) {
    this.config = config;
    this.create(scene);
  }

  private create(scene: THREE.Scene): void {
    const {
      xMin,
      xMax,
      zStart,
      zEnd,
      spacing,
      minHeight,
      maxHeight,
      minWidth,
      maxWidth,
    } = this.config;

    for (let z = zStart; z <= zEnd; z += spacing) {
      const x = THREE.MathUtils.randFloat(xMin, xMax);
      const height = THREE.MathUtils.randFloat(minHeight, maxHeight);
      const width = THREE.MathUtils.randFloat(minWidth, maxWidth);

      const building = new CityBuilding(width, height, width);
      building.position.set(x, -height, z);

      scene.add(building);
      this.buildings.push(building);
    }
  }

  public update(deltaTime: number, baseSpeed: number): void {
    const diff = deltaTime * baseSpeed * this.config.speedFactor;

    for (const b of this.buildings) {
      b.position.z += diff;

      if (b.position.z > 10) {
        b.position.z -= this.config.zEnd - this.config.zStart;
      }
    }
  }
}
