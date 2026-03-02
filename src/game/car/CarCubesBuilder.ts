// src/game/car/CarCubesBuilder.ts
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { type CubeConfig, type CubeUserData } from "./types";
import { CAR_CUBES_CONFIG } from "./config";

export class CarCubesBuilder {
  private cubeModelCache: THREE.Group | null = null;

  constructor() {}

  /**
   * Основной метод для построения кубиков машины
   * @param useGLB использовать GLB модель или нет
   * @param cubeModelUrl путь к GLB модели
   * @param onCubeCreated callback для добавления кубика в сцену
   */
  public async buildFromCubes(
    useGLB: boolean,
    cubeModelUrl: string,
    onCubeCreated?: (cube: THREE.Object3D) => void,
  ): Promise<THREE.Object3D[]> {
    const cubes: THREE.Object3D[] = [];

    if (useGLB && cubeModelUrl) {
      try {
        // console.log("📦 Loading GLB model from:", cubeModelUrl);
        const cubeModel = await this.loadCubeModel(cubeModelUrl);
        // console.log("✅ GLB model loaded, building cubes...");

        CAR_CUBES_CONFIG.forEach((config, index) => {
          const cube = this.createCubeFromGLB(cubeModel, config, index);
          cubes.push(cube);
          if (onCubeCreated) onCubeCreated(cube);
        });
      } catch (error) {
        console.error(
          "❌ Error loading GLB model, falling back to primitives:",
          error,
        );
        return this.buildFromPrimitives(onCubeCreated);
      }
    } else {
      // console.log("🔨 Building car from primitives");
      return this.buildFromPrimitives(onCubeCreated);
    }

    return cubes;
  }

  /**
   * Создание кубика из GLB модели
   */
  private createCubeFromGLB(
    model: THREE.Group,
    config: CubeConfig,
    index: number,
  ): THREE.Object3D {
    const cube = model.clone();
    cube.position.set(config.pos[0], config.pos[1], config.pos[2]);
    cube.scale.set(config.scale[0], config.scale[1], config.scale[2]);

    // Обходим все меши и заменяем материалы на MeshStandardMaterial
    cube.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // mesh.material = new THREE.MeshStandardMaterial({
        //   // color: config.color,
        //   roughness: 0.5,
        //   metalness: 0.1,
        // });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    cube.userData = this.createCubeUserData(config, index);
    return cube;
  }

  /**
   * Построение кубиков из примитивов
   */
  private buildFromPrimitives(
    onCubeCreated?: (cube: THREE.Object3D) => void,
  ): THREE.Object3D[] {
    const cubes: THREE.Object3D[] = [];

    CAR_CUBES_CONFIG.forEach((config, index) => {
      const cube = this.createPrimitiveCube(config, index);
      cubes.push(cube);
      if (onCubeCreated) onCubeCreated(cube);
    });

    return cubes;
  }

  /**
   * Создание одного примитивного кубика
   */
  private createPrimitiveCube(config: CubeConfig, index: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 0.5, 1);
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.5,
      metalness: 0.1,
    });
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(config.pos[0], config.pos[1], config.pos[2]);
    cube.scale.set(0.5, 0.5, 0.5);

    cube.castShadow = true;
    cube.receiveShadow = true;

    cube.userData = this.createCubeUserData(config, index);
    return cube;
  }

  /**
   * Создание userData для кубика
   */
  private createCubeUserData(config: CubeConfig, index: number): CubeUserData {
    return {
      originalPos: [...config.pos],
      originalScale: [...config.scale],
      configIndex: index,
      velocity: new THREE.Vector3(0, 0, 0),
      rotationSpeed: new THREE.Vector3(0, 0, 0),
    };
  }

  /**
   * Загрузка GLB модели с кешированием
   */
  private async loadCubeModel(url: string): Promise<THREE.Group> {
    if (this.cubeModelCache) return this.cubeModelCache.clone();

    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          this.cubeModelCache = gltf.scene;
          resolve(gltf.scene.clone());
        },
        undefined,
        reject,
      );
    });
  }

  /**
   * Очистка кеша модели
   */
  public clearCache(): void {
    this.cubeModelCache = null;
  }
}
