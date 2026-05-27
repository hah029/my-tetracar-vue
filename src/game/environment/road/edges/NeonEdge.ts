import * as THREE from "three";

export class NeonEdge extends THREE.Mesh {
  public collider: THREE.Box3;

  /**
   * @param x - позиция бортика по X
   * @param height - высота бортика
   * @param depth - длина вдоль Z
   * @param color - цвет бортика
   */
  constructor(
    x: number,
    height: number = 1,
    depth: number = 200,
    color: number = 0x44ffff,
  ) {
    // геометрия бортика
    const geometry = new THREE.BoxGeometry(0.2, height, depth);

    // материал
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.7,
    });

    super(geometry, material);

    // позиция бортика
    this.position.set(x, height / 2, 10); // центрирование по Y
    this.collider = new THREE.Box3().setFromObject(this);
  }

  /**
   * Обновление коллайдера после возможного перемещения
   */
  public updateCollider(): void {
    this.collider.setFromObject(this);
  }
}
