// src/game/environment/city/CityLayerInstanced.ts

import * as THREE from "three";
import type { CityLayerConfig } from "./types";
import buildingTexture from "@/assets/textures/building.jpg";
import { loadTexture } from "@/helpers/loaders";

export class CityLayerInstanced {
  private mesh!: THREE.InstancedMesh;
  private positions: THREE.Vector3[] = [];
  private scales: THREE.Vector3[] = [];

  private dummy = new THREE.Object3D();
  private config: CityLayerConfig;
  private count: number;
  private scene: THREE.Scene;

  // Граница для зацикливания (как в оригинале)
  private readonly LOOP_THRESHOLD = 10;

  constructor(scene: THREE.Scene, config: CityLayerConfig) {
    this.scene = scene;
    this.config = config;
    this.count = Math.ceil((config.zEnd - config.zStart) / config.spacing) + 2;

    this.init();
  }

  private init() {
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

    // Генерируем позиции и масштабы
    for (let i = 0; i < this.count; i++) {
      const z = zStart + i * spacing; // как в оригинальном цикле for
      const x = THREE.MathUtils.randFloat(xMin, xMax);
      const height = THREE.MathUtils.randFloat(minHeight, maxHeight);
      const width = THREE.MathUtils.randFloat(minWidth, maxWidth);

      // Позиция по y = -height, чтобы центр был на -height (как в CityBuilding)
      const pos = new THREE.Vector3(x, -height, z);
      const scale = new THREE.Vector3(width, height, width); // глубина = ширина

      this.positions.push(pos);
      this.scales.push(scale);
    }

    // Создаём общую геометрию (единичный куб)
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Загружаем текстуру (предполагаем синхронную загрузку/кэш)
    const texture = loadTexture(buildingTexture);
    texture.flipY = false;
    const material = new THREE.MeshStandardMaterial({ map: texture });

    // Создаём InstancedMesh
    this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Устанавливаем матрицы для всех инстансов
    for (let i = 0; i < this.count; i++) {
      this.dummy.position.copy(this.positions[i]);
      this.dummy.scale.copy(this.scales[i]);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.mesh);
  }

  public update(deltaTime: number, baseSpeed: number) {
    if (!this.mesh) return;

    const move = deltaTime * baseSpeed * this.config.speedFactor;
    const cycleLength = this.config.zEnd - this.config.zStart;

    for (let i = 0; i < this.count; i++) {
      const pos = this.positions[i];
      pos.z += move;

      // Зацикливание: если ушли за переднюю границу, перекидываем назад
      if (pos.z > this.LOOP_THRESHOLD) {
        pos.z -= cycleLength;
      }

      // Обновляем матрицу
      this.dummy.position.copy(pos);
      this.dummy.scale.copy(this.scales[i]);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public dispose() {
    if (!this.mesh) return;

    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((m) => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}
