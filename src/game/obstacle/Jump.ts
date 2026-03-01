// src/game/Jump.ts
import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";

export interface JumpConfig {
  lane: number;
  materialIndex: number;
  pulseSpeed: number;
  pulsePhase: number;
  activated: boolean;
}

export class Jump extends THREE.Mesh {
  public userData: JumpConfig;
  private collider: THREE.Box3;

  constructor(laneIndex: number, scene: THREE.Scene, zPos: number = -60) {
    // Геометрия трамплина
    const width = 2;
    const height = 0.2;
    const depth = 2;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometry.rotateX(Math.PI / 12);

    // Материалы с подсветкой
    const materials = [
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.85,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0x442200,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.85,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0x442200,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.85,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xff4400,
        emissive: 0x441100,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.85,
      }),
    ];

    const materialIndex: number = 0;
    // const materialIndex = Math.floor(Math.random() * materials.length);
    const material = materials[materialIndex];
    if (material === undefined) {
      throw new Error("Material for jump is undefined");
    }
    super(geometry, material.clone());

    // Позиция по полосе через RoadManager
    let x: number;
    try {
      x = RoadManager.getInstance().getLanePosition(laneIndex);
    } catch {
      const defaultLanes = [-3, -1, 1, 3];
      x = defaultLanes[laneIndex] ?? 0;
    }

    this.position.set(x, 0.25, zPos);

    // userData для пульса свечения
    this.userData = {
      lane: laneIndex,
      materialIndex,
      pulseSpeed: 0.3 + Math.random() * 0.3,
      pulsePhase: Math.random() * Math.PI * 2,
      activated: false,
    };

    this.collider = new THREE.Box3().setFromObject(this);

    // Добавляем в сцену
    scene.add(this);
  }

  // Движение трамплина и анимация свечения
  public update(speed: number): boolean {
    this.position.z += speed;

    // обновляем коллайдер
    this.collider.setFromObject(this);

    // анимация свечения
    const mat = this.material as THREE.MeshStandardMaterial;
    if (mat.emissiveIntensity !== undefined) {
      const pulse =
        Math.sin(Date.now() * 0.005 + this.userData.pulsePhase) * 0.3 + 0.7;
      mat.emissiveIntensity = 1.2 * pulse;
    }

    // удаляем, если вышел за предел сцены
    return this.position.z > 10;
  }

  public getBoundingBox(): THREE.Box3 {
    return this.collider.clone();
  }
}
