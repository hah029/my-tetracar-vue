import * as THREE from "three";
import type { RoadConfig } from "./types";
import { loadTexture } from "@/helpers/loaders";
import { useEnvironmentStore } from "@/store/environmentStore";

export class Road extends THREE.Mesh {
  public readonly lanes: number[];
  public readonly width: number;
  public readonly length: number;

  constructor(config?: RoadConfig) {
    const tmpConfig = {
      ...useEnvironmentStore().DEFAULT_ROAD_CONFIG,
      ...config,
    };
    if (!tmpConfig.lanes || tmpConfig.lanes.length === 0) {
      throw new Error("Road must have at least one lane");
    }

    const width = useEnvironmentStore().calculateRoadWidth(tmpConfig.lanes);
    const geometry = new THREE.PlaneGeometry(width, tmpConfig.length!);
    let material: THREE.Material;

    if (tmpConfig.textureUrl) {
      const texture = loadTexture(tmpConfig.textureUrl!);

      // Настраиваем повторение
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      const tileSize = 2;
      texture.repeat.set(width / tileSize, tmpConfig.length! / tileSize);

      material = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: 0xffffff,
        // emissiveIntensity: 0.8,  // пока отключил - из-за нее не рисовалась текстура
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0.45,
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.2,
        // side: THREE.DoubleSide,
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

  // получаем позицию полосы по индексу
  public getLanePosition(index: number): number {
    if (index < 0 || index >= this.lanes.length) {
      throw new Error(
        `Lane index ${index} out of range (0-${this.lanes.length - 1})`,
      );
    }

    const lane = this.lanes[index];
    if (lane === undefined)
      throw new Error(`Lane at index ${index} is undefined`);

    return lane;
  }

  // получаем количество полос
  public getLanesCount(): number {
    return this.lanes.length;
  }

  // получаем все позиции полос
  public getLanePositions(): number[] {
    return [...this.lanes];
  }

  // получаем позиции границ дороги
  public getEdgePositions(): { left: number; right: number } {
    return useEnvironmentStore().getEdgePositions(this.lanes);
  }
}
