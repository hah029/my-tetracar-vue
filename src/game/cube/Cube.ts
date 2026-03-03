// cube/CubeBuilder.ts
import * as THREE from "three";
import { loadCubeModel } from "./loadCube";
import type { CubeConfig, CubeUserData } from "./types";

export class CubeBuilder {
  private static modelCache = new Map<string, THREE.Group>();

  /**
   * Асинхронно создаёт куб по конфигурации.
   * @param params.useGLB - использовать GLB модель или примитив
   * @param params.modelUrl - URL GLB модели (обязателен, если useGLB = true)
   * @param params.config - конфигурация куба
   * @param params.index - индекс куба в препятствии
   */
  static async build(params: {
    useGLB?: boolean;
    modelUrl?: string;
    config: CubeConfig;
    index: number;
  }): Promise<THREE.Object3D> {
    const { useGLB = false, modelUrl, config, index } = params;

    if (useGLB && modelUrl) {
      // Загружаем модель (с кешированием)
      const model = await CubeBuilder.loadModel(modelUrl);
      return CubeBuilder.createCubeFromGLB(model, config, index);
    } else {
      return CubeBuilder.createPrimitiveCube(config, index);
    }
  }

  private static async loadModel(url: string): Promise<THREE.Group> {
    if (CubeBuilder.modelCache.has(url)) {
      return CubeBuilder.modelCache.get(url)!.clone();
    }
    const model = await loadCubeModel(url); // loadCubeModel сам возвращает клон
    CubeBuilder.modelCache.set(url, model);
    return model.clone(); // возвращаем ещё один клон для безопасности
  }

  private static createCubeFromGLB(
    model: THREE.Group,
    config: CubeConfig,
    index: number,
  ): THREE.Object3D {
    const cube = model.clone(); // клонируем, чтобы не изменять оригинал в кеше
    cube.position.set(config.pos[0], config.pos[1], config.pos[2]);
    cube.scale.set(config.scale[0], config.scale[1], config.scale[2]);

    cube.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // При необходимости можно менять материал, но цвет, вероятно, уже в модели
      }
    });

    cube.userData = CubeBuilder.createCubeUserData(config, index);
    return cube;
  }

  private static createPrimitiveCube(
    config: CubeConfig,
    index: number,
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 0.5, 1);
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.5,
      metalness: 0.1,
    });
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(config.pos[0], config.pos[1], config.pos[2]);
    cube.scale.set(config.scale[0], config.scale[1], config.scale[2]);

    cube.castShadow = true;
    cube.receiveShadow = true;

    cube.userData = CubeBuilder.createCubeUserData(config, index);
    return cube;
  }

  private static createCubeUserData(
    config: CubeConfig,
    index: number,
  ): CubeUserData {
    return {
      originalPos: [...config.pos],
      originalScale: [...config.scale],
      configIndex: index,
      velocity: new THREE.Vector3(0, 0, 0),
      rotationSpeed: new THREE.Vector3(0, 0, 0),
    };
  }
}