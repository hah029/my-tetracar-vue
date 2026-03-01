import * as THREE from "three";

export interface SideObjectConfig {
  color?: number;
  height?: number;
  radius?: number;
  radialSegments?: number;
  offset?: number; // Отступ от края дороги
  spacing?: number; // Расстояние между объектами
}

export class SideObject extends THREE.Mesh {
  private static readonly DEFAULT_CONFIG: Required<SideObjectConfig> = {
    color: 0xffff00,
    height: 0.5,
    radius: 0.1,
    radialSegments: 8,
    offset: 1,
    spacing: 7,
  };

  private config: Required<SideObjectConfig>;
  private baseZ: number;

  constructor(zPos: number, config: SideObjectConfig = {}) {
    const finalConfig = { ...SideObject.DEFAULT_CONFIG, ...config };

    const geometry = new THREE.CylinderGeometry(
      finalConfig.radius,
      finalConfig.radius,
      finalConfig.height,
      finalConfig.radialSegments,
    );
    const material = new THREE.MeshStandardMaterial({
      color: finalConfig.color,
    });

    super(geometry, material);

    this.config = finalConfig;
    this.baseZ = zPos;

    this.castShadow = true;
    this.receiveShadow = true;
  }

  public update(speed: number, roadLength: number): void {
    this.position.z += speed;
    if (this.position.z > 10) {
      this.position.z = this.baseZ - roadLength; // вместо жёсткого смещения
    }
    // this.position.x = this.side; // вместо жёсткого смещения
  }

  public setPosition(x: number, z: number): void {
    this.position.set(x, this.config.height / 2, z);
  }
}
