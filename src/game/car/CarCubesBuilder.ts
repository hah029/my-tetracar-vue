// src/game/car/CarCubesBuilder.ts
import * as THREE from "three";
import { type GeometryConfig, type MaterialConfig } from "@/game/cube/types";
import { CubeBuilder } from "@/game/cube/Cube";
import { usePlayerStore } from "@/store/playerStore";

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
    onCubeCreated?: (cube: THREE.Object3D) => void,
  ): Promise<THREE.Object3D[]> {
    const cubes: THREE.Object3D[] = [];
    const playerStore = usePlayerStore();

    // Проходим по всем конфигам кубиков
    for (let i = 0; i < playerStore.CAR_CUBES_CONFIG.length; i++) {
      const config = playerStore.CAR_CUBES_CONFIG[i];
      if (!config) continue;

      // Преобразуем конфиг в geomConfig и materialConfig
      const geomConfig: GeometryConfig = {
        pos: config.pos,
        scale: config.scale,
        name: config.name,
        modelUrl: useGLB ? config.modelUrl : undefined,
      };

      const materialConfig: MaterialConfig = playerStore.CAR_MATERIAL_CONFIG;

      try {
        const cube = await CubeBuilder.build({
          index: i,
          geomConfig,
          useGLB,
          useTexture: !!playerStore.CAR_MATERIAL_CONFIG.textureUrl,
          materialConfig,
        });
        cubes.push(cube);
        if (onCubeCreated) onCubeCreated(cube);
      } catch (error) {
        console.error(`❌ Ошибка создания кубика ${i}:`, error);
        const fallbackCube = await CubeBuilder.build({
          index: i,
          geomConfig,
          useGLB: false,
          useTexture: !!playerStore.CAR_MATERIAL_CONFIG.textureUrl,
          materialConfig,
        });
        cubes.push(fallbackCube);
        if (onCubeCreated) onCubeCreated(fallbackCube);
      }
    }

    return cubes;
  }
}
