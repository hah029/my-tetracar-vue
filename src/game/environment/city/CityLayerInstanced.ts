// src/game/environment/city/CityLayerInstanced.ts

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { CityLayerConfig } from "./types";
import { loadCubeModel } from "@/game/cube/loadCube";

// Вспомогательная функция для создания InstancedMesh из GLB-модели
async function createInstancedMeshFromModel(
  url: string,
  count: number,
  scene: THREE.Scene,
  config: CityLayerConfig,
): Promise<THREE.InstancedMesh> {
  const model = await loadCubeModel(url); // возвращает клонированную группу

  // Временно добавляем модель в сцену, чтобы вычислить мировые матрицы всех мешей
  scene.add(model);
  model.updateMatrixWorld(true);

  const geometries: THREE.BufferGeometry[] = [];
  let sourceMaterial: THREE.Material | null = null;

  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      // Берём материал первого меша (предполагаем, что все материалы одинаковы)
      if (!sourceMaterial && mesh.material) {
        sourceMaterial = Array.isArray(mesh.material)
          ? mesh.material[0]!
          : mesh.material;
      }
      // Клонируем геометрию и применяем мировую матрицу меша
      const geom = mesh.geometry.clone();
      geom.applyMatrix4(mesh.matrixWorld);
      geometries.push(geom);
    }
  });

  // Удаляем временную модель
  scene.remove(model);

  if (geometries.length === 0) {
    throw new Error(`Модель ${url} не содержит мешей`);
  }

  // Объединяем все геометрии в одну
  const mergedGeometry = mergeGeometries(geometries);
  if (!mergedGeometry) {
    throw new Error(`Не удалось объединить геометрии для модели ${url}`);
  }

  // Если материал не найден, создаём стандартный
  const material =
    (sourceMaterial as THREE.Material | null)?.clone() ??
    new THREE.MeshStandardMaterial({ color: 0xffffff });

  const instancedMesh = new THREE.InstancedMesh(
    mergedGeometry,
    material,
    count,
  );

  if (Array.isArray(instancedMesh.material)) {
    instancedMesh.material.forEach((mat) => {
      applyMaterialConfig(mat, config);
    });
  } else {
    applyMaterialConfig(instancedMesh.material, config);
  }

  instancedMesh.castShadow = false;
  instancedMesh.receiveShadow = false;
  instancedMesh.frustumCulled = false; // для постоянно движущихся объектов

  return instancedMesh;
}

function applyMaterialConfig(
  material: THREE.Material,
  config: CityLayerConfig,
) {
  if (!(material instanceof THREE.MeshStandardMaterial)) return;

  material.color.setHex(config.color);
  material.emissive.setHex(config.emissive ?? 0xffffff);
  material.emissiveIntensity = config.emissiveIntensity ?? 3;
  material.emissiveMap = material.map;
  material.transparent = (config.opacity ?? 1) < 1;
  material.opacity = config.opacity ?? 1;
}

export class CityLayerInstanced {
  private meshes: THREE.InstancedMesh[] = [];
  private positionsPerMesh: THREE.Vector3[][] = [];
  private scalesPerMesh: THREE.Vector3[][] = [];

  private dummy = new THREE.Object3D();
  private config: CityLayerConfig;
  private scene: THREE.Scene;
  private modelUrls: string[];

  private readonly LOOP_THRESHOLD = 10;

  private frameSkip = 0;
  private readonly SKIP_FRAMES = 2; // каждый 2-й кадр

  // Приватный конструктор — используйте статический фабричный метод create
  private constructor(
    scene: THREE.Scene,
    config: CityLayerConfig,
    modelUrls: string[],
  ) {
    this.scene = scene;
    this.config = config;
    this.modelUrls = modelUrls;
  }

  // Асинхронный фабричный метод: создаёт слой после загрузки всех моделей
  static async create(
    scene: THREE.Scene,
    config: CityLayerConfig,
    modelUrls: string[],
  ): Promise<CityLayerInstanced> {
    const layer = new CityLayerInstanced(scene, config, modelUrls);
    await layer.init();
    return layer;
  }

  private async init() {
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

    const totalCount = Math.ceil((zEnd - zStart) / spacing) + 2;

    // Генерируем экземпляры со случайным выбором модели
    const instances: {
      pos: THREE.Vector3;
      scale: THREE.Vector3;
      modelIndex: number;
    }[] = [];

    for (let i = 0; i < totalCount; i++) {
      const z = zStart + i * spacing;
      const x = THREE.MathUtils.randFloat(xMin, xMax);
      const height = THREE.MathUtils.randFloat(minHeight, maxHeight);
      const width = THREE.MathUtils.randFloat(minWidth, maxWidth);

      const pos = new THREE.Vector3(x, this.config.y, z);
      const scale = new THREE.Vector3(width, height, width);
      const modelIndex = Math.floor(Math.random() * this.modelUrls.length);

      instances.push({ pos, scale, modelIndex });
    }

    // Группируем по modelIndex
    const instancesByModel: { pos: THREE.Vector3[]; scale: THREE.Vector3[] }[] =
      this.modelUrls.map(() => ({ pos: [], scale: [] }));

    instances.forEach((inst) => {
      instancesByModel[inst.modelIndex]!.pos.push(inst.pos);
      instancesByModel[inst.modelIndex]!.scale.push(inst.scale);
    });

    // Загружаем модели и создаём меши
    for (let idx = 0; idx < this.modelUrls.length; idx++) {
      const url = this.modelUrls[idx]!;
      const count = instancesByModel[idx]!.pos.length;
      if (count === 0) continue;

      // Создаём инстанс-меш для текущей модели
      const mesh = await createInstancedMeshFromModel(
        url,
        count,
        this.scene,
        this.config,
      );

      // Заполняем матрицы
      for (let i = 0; i < count; i++) {
        this.dummy.position.copy(instancesByModel[idx]!.pos[i]!);
        this.dummy.scale.copy(instancesByModel[idx]!.scale[i]!);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      this.meshes.push(mesh);
      this.positionsPerMesh.push(instancesByModel[idx]!.pos);
      this.scalesPerMesh.push(instancesByModel[idx]!.scale);

      this.scene.add(mesh);
    }
  }

  public update(deltaTime: number, baseSpeed: number) {
    if (this.meshes.length === 0) return;

    const move = deltaTime * baseSpeed * this.config.speedFactor;
    const cycleLength = this.config.zEnd - this.config.zStart;
    const LOOP_BOUNDARY = this.LOOP_THRESHOLD;

    // ========== 1. ВСЕГДА обновляем позиции в данных ==========
    for (let m = 0; m < this.meshes.length; m++) {
      const positions = this.positionsPerMesh[m];
      if (!positions) continue;

      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        if (!pos) continue;

        pos.z += move;

        if (pos.z > LOOP_BOUNDARY) {
          pos.z -= cycleLength;
        }
      }
    }

    // ========== 2. ОБНОВЛЯЕМ МАТРИЦЫ только каждый N-й кадр ==========
    this.frameSkip++;
    const shouldUpdateMatrices = this.frameSkip >= this.SKIP_FRAMES;

    if (shouldUpdateMatrices) {
      this.frameSkip = 0;

      for (let m = 0; m < this.meshes.length; m++) {
        const mesh = this.meshes[m];
        const positions = this.positionsPerMesh[m];
        const scales = this.scalesPerMesh[m];
        if (!mesh || !positions || !scales) continue;

        for (let i = 0; i < positions.length; i++) {
          this.dummy.position.copy(positions[i]!);
          this.dummy.scale.copy(scales[i]!);
          this.dummy.updateMatrix();
          mesh.setMatrixAt(i, this.dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  public dispose() {
    for (const mesh of this.meshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    this.meshes = [];
    this.positionsPerMesh = [];
    this.scalesPerMesh = [];
  }
}
