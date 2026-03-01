// src/game/Obstacle.ts
import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";
import type { ObstacleConfig } from "./types";

// Класс для отдельного препятствия
export class Obstacle extends THREE.Mesh {
  public userData: ObstacleConfig;
  public collider: THREE.Box3;

  constructor(
    laneIndex: number,
    scene: THREE.Scene,
    zPos: number = -60,
    _variant: number | null = null,
  ) {
    // Создаём материалы для препятствий
    const materials = Obstacle.createMaterials();

    // Выбираем материал
    const materialIndex = 0;
    let material: THREE.Material;
    if (materials[materialIndex] === undefined) {
      throw new Error("Obstacle material is undefined");
    }
    material = materials[materialIndex].clone();

    // Используем единую геометрию
    const geometry = new THREE.BoxGeometry(1.8, 0.5, 1.2);

    super(geometry, material);

    // Получаем позицию полосы из RoadManager
    let x: number;
    try {
      const roadManager = RoadManager.getInstance();
      x = roadManager.getLanePosition(laneIndex);
    } catch (error) {
      // Fallback на случай, если RoadManager еще не инициализирован
      console.warn("RoadManager not initialized, using default lane positions");
      const defaultLanes = [-4, -2, 0, 2, 4];
      x = defaultLanes[laneIndex] || 0;
    }

    if (isNaN(x) || isNaN(zPos)) {
      throw new Error(`Invalid position: x=${x}, z=${zPos}`);
    }

    this.position.set(x, 0.25, zPos);
    // this.rotation.y = Math.random() * Math.PI;

    // Настраиваем userData
    this.userData = {
      lane: laneIndex,
      variant: materialIndex,
      baseColor: (material as THREE.MeshStandardMaterial).color.clone(),
      pulseSpeed: 0.5 + Math.random() * 0.5,
      pulsePhase: Math.random() * Math.PI * 2,
    };
    this.collider = new THREE.Box3().setFromObject(this);

    // Добавляем в сцену
    scene.add(this);
  }

  // Статический метод для создания материалов
  private static createMaterials(): THREE.MeshStandardMaterial[] {
    return [
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x000000,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xff3366,
        emissive: 0x440011,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0x442200,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x44ff88,
        emissive: 0x004422,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xaa44ff,
        emissive: 0x220044,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9,
      }),
    ];
  }

  // Обновление препятствия (анимация и движение)
  public update(speed: number): boolean {
    this.position.z += speed;

    this.collider.setFromObject(this);

    // анимация
    // const material = this.material as THREE.MeshStandardMaterial;
    // if (material.emissive) {
    //   const pulse =
    //     Math.sin(Date.now() * 0.005 + this.userData.pulsePhase) * 0.5 + 0.5;
    //   material.emissiveIntensity = 1.0 + pulse * 1.0;
    //   this.rotation.y += 0.02;
    // }

    return this.position.z > 10;
  }

  // Получить bounding box для коллизий
  public getBoundingBox(): THREE.Box3 {
    return new THREE.Box3().setFromObject(this);
  }
}
