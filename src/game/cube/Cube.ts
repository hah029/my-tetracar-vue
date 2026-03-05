// cube/CubeBuilder.ts
import * as THREE from "three";
import { loadCubeModel } from "./loadCube";
import type { GeometryConfig, CubeUserData, MaterialConfig } from "./types";
import { loadTexture } from "@/helpers/loaders";

export class CubeBuilder {
  private static modelCache = new Map<string, THREE.Group>();

  static async build(params: {
    index?: number;
    useGLB?: boolean;
    geomConfig: GeometryConfig;
    useTexture?: boolean;
    materialConfig?: MaterialConfig;
  }): Promise<THREE.Object3D> {
    const { index, geomConfig, useGLB, materialConfig, useTexture } = params;
    let cube: THREE.Object3D;

    if (useGLB && geomConfig.modelUrl) {
      const model = await CubeBuilder.loadModel(geomConfig.modelUrl);
      cube = CubeBuilder.createCubeFromGLB(model, geomConfig);
      // Применить текстуру если нужно
      if (useTexture && materialConfig?.textureUrl) {
        const texture = loadTexture(materialConfig.textureUrl);

        cube.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,
              color: materialConfig.color ?? 0xffffff,
              emissive: materialConfig.emissive ?? 0x000000,
              emissiveIntensity: materialConfig.emissiveIntensity ?? 1,
            });
          }
        });
      }
    } else {
      let material: THREE.Material;
      if (useTexture && materialConfig?.textureUrl) {
        const texture = loadTexture(materialConfig.textureUrl);
        material = new THREE.MeshStandardMaterial({
          map: texture,
          color: materialConfig.color,
          emissive: materialConfig.emissive,
          emissiveIntensity: materialConfig.emissiveIntensity,
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: materialConfig?.color ?? 0xffffff,
          emissive: materialConfig?.emissive ?? 0x000000,
          emissiveIntensity: materialConfig?.emissiveIntensity ?? 1,
        });
      }
      cube = CubeBuilder.createPrimitiveCube(geomConfig, material);
    }

    if (index !== undefined) {
      cube.userData = CubeBuilder.createCubeUserData(geomConfig, index);
    }

    return cube;
  }

  private static async loadModel(url: string): Promise<THREE.Group> {
    if (CubeBuilder.modelCache.has(url)) {
      return CubeBuilder.modelCache.get(url)!.clone();
    }
    const model = await loadCubeModel(url);
    CubeBuilder.modelCache.set(url, model);
    return model.clone();
  }

  private static createCubeFromGLB(
    model: THREE.Group,
    config: GeometryConfig,
  ): THREE.Object3D {
    const cube = model.clone();
    const pos = config.pos ?? [0, 0, 0];
    cube.position.set(pos[0], pos[1], pos[2]);
    cube.scale.set(config.scale[0], config.scale[1], config.scale[2]);
    // Можно пробежаться по мешам и включить тени
    cube.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    // Логирование для диагностики масштаба
    return cube;
  }

  private static createPrimitiveCube(
    config: GeometryConfig,
    material: THREE.Material,
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const cube = new THREE.Mesh(geometry, material);
    const pos = config.pos ?? [0, 0, 0];
    cube.position.set(pos[0], pos[1], pos[2]);
    cube.scale.set(config.scale[0], config.scale[1], config.scale[2]);
    cube.castShadow = true;
    cube.receiveShadow = true;
    return cube;
  }

  private static createCubeUserData(
    config: GeometryConfig,
    index: number,
  ): CubeUserData {
    const pos = config.pos ?? [0, 0, 0];
    return {
      originalPos: [...pos],
      originalScale: [...config.scale],
      configIndex: index,
      velocity: new THREE.Vector3(0, 0, 0),
      rotationSpeed: new THREE.Vector3(0, 0, 0),
    };
  }
}
