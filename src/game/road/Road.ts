import * as THREE from "three";
import { type RoadConfig } from "./types";
import {
  DEFAULT_ROAD_CONFIG,
  calculateRoadWidth,
  getEdgePositions,
} from "./config";
import { loadTexture } from "@/helpers/loaders";
// import { XZ_SCALING } from "../cube/config";
// import { isLeftHandSideExpression } from "typescript";

export class Road extends THREE.Mesh {
  public readonly lanes: number[];
  public readonly width: number;
  public readonly length: number;

  constructor(config?: RoadConfig) {
    const tmpConfig = { ...DEFAULT_ROAD_CONFIG, ...config };
    if (!tmpConfig.lanes || tmpConfig.lanes.length === 0) {
      throw new Error("Road must have at least one lane");
    }
    const width = calculateRoadWidth(tmpConfig.lanes);

    const geometry = new THREE.PlaneGeometry(width, tmpConfig.length!);
    let material: THREE.Material;

    if (tmpConfig.textureUrl) {
      const texture = loadTexture(tmpConfig.textureUrl!);

      // Настраиваем повторение
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      const tileSize = 0.6;
      texture.repeat.set(width / tileSize, tmpConfig.length! / tileSize);

      material = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: 0x224466,
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        side: THREE.DoubleSide,
      });
    }

    super(geometry, material);

    this.lanes = [...tmpConfig.lanes];
    this.width = width;
    this.length = tmpConfig.length!;

    this.rotation.x = -Math.PI / 2;
    this.position.z = 0;
    this.position.y = tmpConfig.yPosition!;
    this.receiveShadow = false;
  }

  // Получить позицию полосы по индексу
  public getLanePosition(index: number): number {
    if (
      index < 0 ||
      index >= this.lanes.length ||
      this.lanes[index] === undefined
    ) {
      throw new Error(`Lane index ${index} out of range`);
    }
    return this.lanes[index];
  }

  // Получить количество полос
  public getLanesCount(): number {
    return this.lanes.length;
  }

  // Получить все позиции полос
  public getLanePositions(): number[] {
    return [...this.lanes];
  }

  // Получить позиции границ дороги
  public getEdgePositions(): { left: number; right: number } {
    return getEdgePositions(this.lanes);
  }
}
