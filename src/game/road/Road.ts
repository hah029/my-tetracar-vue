import * as THREE from "three";
import { type RoadConfig } from "./types";
import { DEFAULT_ROAD_CONFIG, calculateRoadWidth } from "./config";

export class Road extends THREE.Mesh {
  public readonly lanes: number[];
  public readonly width: number;
  public readonly length: number;
  public readonly edgeOffset: number;

  constructor(config: RoadConfig) {
    // lanes обязателен, поэтому не используем DEFAULT_ROAD_CONFIG полностью
    const finalConfig = { ...DEFAULT_ROAD_CONFIG, ...config };

  //   console.log('Road constructor with config:', {
  //   lanes: finalConfig.lanes,
  //   width: finalConfig.width,
  //   length: finalConfig.length,
  //   position: [-finalConfig.length/2 + 10, finalConfig.yPosition, 0]
  // });
    
    if (!finalConfig.lanes || finalConfig.lanes.length === 0) {
      throw new Error('Road must have at least one lane');
    }

    // Вычисляем ширину на основе lanes, если не указана явно
    const width = finalConfig.width || calculateRoadWidth(finalConfig.lanes, finalConfig.edgeOffset);
    
    const geometry = new THREE.PlaneGeometry(width, finalConfig.length);
    // const material = new THREE.MeshStandardMaterial({
    //   color: finalConfig.color,
    //   emissive: finalConfig.emissive,
    //   transparent: true,
    //   opacity: finalConfig.opacity,
    //   side: THREE.DoubleSide
    // });
    const material = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      emissive: 0x224466,
      emissiveIntensity: 3.0,  // Очень ярко!
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    super(geometry, material);

    this.lanes = [...finalConfig.lanes];
    this.width = width;
    this.length = finalConfig.length;
    this.edgeOffset = finalConfig.edgeOffset;

    this.rotation.x = -Math.PI / 2;
    this.position.z = -finalConfig.length / 2 + 10;
    this.position.y = finalConfig.yPosition;
    this.receiveShadow = true;

  //   console.log('Road mesh created with geometry:', {
  //   width: this.width,
  //   length: this.length,
  //   position: this.position
  // });
  }

  // Получить позицию полосы по индексу
  public getLanePosition(index: number): number {
    if (index < 0 || index >= this.lanes.length) {
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
    const minLane = Math.min(...this.lanes);
    const maxLane = Math.max(...this.lanes);
    return {
      left: minLane - this.edgeOffset,
      right: maxLane + this.edgeOffset
    };
  }
}