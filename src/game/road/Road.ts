import * as THREE from "three";
import { type RoadConfig } from "./types";
import { DEFAULT_ROAD_CONFIG, calculateRoadWidth } from "./config";

export class Road extends THREE.Mesh {
  public readonly lanes: number[];
  public readonly width: number;
  public readonly length: number;
  public readonly edgeOffset: number;

  constructor(config: RoadConfig) {
    const finalConfig = { ...DEFAULT_ROAD_CONFIG, ...config };
    if (!finalConfig.lanes || finalConfig.lanes.length === 0) {
      throw new Error("Road must have at least one lane");
    }

    // Вычисляем ширину на основе lanes, если не указана явно
    const width =
      finalConfig.width ||
      calculateRoadWidth(finalConfig.lanes, finalConfig.edgeOffset);

    const geometry = new THREE.PlaneGeometry(width, finalConfig.length);
    let material: THREE.Material;

    if (finalConfig.textureUrl) {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(
        finalConfig.textureUrl,
        () => {
          console.log("✅ Текстура успешно загружена");
          // можно принудительно обновить материал, если нужно
        },
        undefined,
        (err) => {
          console.error("❌ Ошибка загрузки текстуры:", err);
        },
      );
      // console.log(texture);

      // Настраиваем повторение
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      // Допустим, размер одного квадрата текстуры в реальном мире = 1 единица.
      // Тогда, чтобы квадрат заполнил всю ширину и длину без искажений,
      // repeat по X = width, по Y = length.
      // Если текстура должна повторяться чаще (например, каждый метр),
      // можно использовать width / tileSize, где tileSize – желаемый размер плитки.
      const tileSize = 0.7; // размер плитки в мировых единицах
      texture.repeat.set(width / tileSize, finalConfig.length / tileSize);

      material = new THREE.MeshStandardMaterial({
        map: texture,
        // transparent: false,
        emissive: 0x224466,
        emissiveIntensity: 2.0,
        side: THREE.DoubleSide,
      });
    } else {
      // Запасной вариант, если текстура не передана
      material = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        side: THREE.DoubleSide,
      });
    }

    // console.log(material);

    super(geometry, material);

    this.lanes = [...finalConfig.lanes];
    this.width = width;
    this.length = finalConfig.length;
    this.edgeOffset = finalConfig.edgeOffset + 1;

    this.rotation.x = -Math.PI / 2;
    this.position.z = 0;
    this.position.y = finalConfig.yPosition;
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
    const minLane = Math.min(...this.lanes);
    const maxLane = Math.max(...this.lanes);
    return {
      left: minLane - this.edgeOffset,
      right: maxLane + this.edgeOffset,
    };
  }
}
