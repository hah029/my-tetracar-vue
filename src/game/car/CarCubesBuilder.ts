// src/game/car/CarCubesBuilder.ts
import * as THREE from "three";
import { type GeometryConfig, type MaterialConfig } from "@/game/cube/types";
import { CAR_CUBES_CONFIG, CAR_MATERIAL_CONFIG } from "./config";
import { CubeBuilder } from "@/game/cube/Cube";

export class CarCubesBuilder {
  constructor() {}

  /**
   * Основной метод для построения кубиков машины
   * @param useGLB использовать GLB модель или нет
   * @param cubeModelUrl путь к GLB модели (обязателен, если useGLB = true)
   * @param onCubeCreated callback для добавления кубика в сцену
   */
  public async buildFromCubes(
    useGLB: boolean,
    // cubeModelUrl: string,
    onCubeCreated?: (cube: THREE.Object3D) => void,
  ): Promise<THREE.Object3D[]> {
    const cubes: THREE.Object3D[] = [];

    // Проходим по всем конфигам кубиков
    for (let i = 0; i < CAR_CUBES_CONFIG.length; i++) {
      const config = CAR_CUBES_CONFIG[i];
      if (!config) continue;

      // Преобразуем конфиг в geomConfig и materialConfig
      const geomConfig: GeometryConfig = {
        pos: config.pos,
        scale: config.scale,
        name: config.name,
        // Если используется GLB, добавляем modelUrl
        modelUrl: useGLB ? config.modelUrl : undefined,
      };

      const materialConfig: MaterialConfig = {
        textureUrl: CAR_MATERIAL_CONFIG.textureUrl,
        color: CAR_MATERIAL_CONFIG.color,
        emissive: CAR_MATERIAL_CONFIG.emissive,
        emissiveIntensity: CAR_MATERIAL_CONFIG.emissiveIntensity,
      };

      try {
        const cube = await CubeBuilder.build({
          index: i,
          geomConfig,
          useGLB,
          useTexture: !!CAR_MATERIAL_CONFIG.textureUrl,
          materialConfig,
        });
        cubes.push(cube);
        if (onCubeCreated) onCubeCreated(cube);
      } catch (error) {
        console.error(`❌ Ошибка создания кубика ${i}:`, error);
        // В случае ошибки создаём примитивный куб без GLB
        const fallbackCube = await CubeBuilder.build({
          index: i,
          geomConfig,
          useGLB: false,
          useTexture: !!CAR_MATERIAL_CONFIG.textureUrl,
          materialConfig,
        });
        cubes.push(fallbackCube);
        if (onCubeCreated) onCubeCreated(fallbackCube);
      }
    }

    return cubes;
  }
}
