import * as THREE from "three";
import { type SpeedLineConfig } from "./types";

export interface SpeedLineBounds {
  left: number;
  right: number;
}

export class SpeedLine extends THREE.Line {
  private speed: number;
  private bounds: SpeedLineBounds;

  constructor(config: SpeedLineConfig & { bounds?: SpeedLineBounds } = {}) {
    const {
      color = 0x88aaff,
      length = 5,
      speed: lineSpeed = 0.5,
      bounds = { left: -6, right: 6 }  // Значения по умолчанию
    } = config;

    // Спавним в пределах дороги
    const roadWidth = bounds.right - bounds.left;
    const x = bounds.left + Math.random() * roadWidth;
    const z = Math.random() * 200 - 100;

    const points = [
      new THREE.Vector3(x, 0.1, z),
      new THREE.Vector3(
        x + (Math.random() - 0.5) * 2,
        0.1,
        z + length
      )
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });

    super(geometry, material);

    this.speed = lineSpeed;
    this.bounds = bounds;

    this.userData = {
      isSpeedLine: true,
      speed: this.speed
    };
  }

  public update(speed: number): void {
    this.position.z += speed * this.speed;

    if (this.position.z > 20) {
      this.position.z = -80;
      // Респавним в пределах дороги
      const roadWidth = this.bounds.right - this.bounds.left;
      this.position.x = this.bounds.left + Math.random() * roadWidth;
      this.updateGeometry();
    }
  }

  private updateGeometry(): void {
    const points = [
      new THREE.Vector3(this.position.x, 0.1, this.position.z),
      new THREE.Vector3(
        this.position.x + (Math.random() - 0.5) * 2,
        0.1,
        this.position.z + 5
      )
    ];
    
    this.geometry.dispose();
    this.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }
}