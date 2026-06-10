import * as THREE from "three";
import { loadCubeModel } from "./loadCube";
import type { GeometryConfig, CubeUserData, MaterialConfig } from "./types";
import { loadTexture } from "@/helpers/loaders";
import { useCommonStore } from "@/store/commonStore";

export class CubeBuilder {
  private static modelCache = new Map<string, THREE.Group>();

  static async build(params: {
    index?: number;
    useGLB?: boolean;
    geomConfig: GeometryConfig;
    useTexture?: boolean;
    materialConfig?: MaterialConfig;
    existingMaterial?: THREE.Material;  // 👈 НОВЫЙ ПАРАМЕТР
  }): Promise<THREE.Object3D> {
    const { index, geomConfig, useGLB, materialConfig, useTexture, existingMaterial } = params;

    let cube: THREE.Object3D;

    const commonStore = useCommonStore();
    const _materialConfig: MaterialConfig = {
        color: commonStore.BASE_CUBE_MATERIAL_CONFIG.color ?? 0xffffff,
        emissive: commonStore.BASE_CUBE_MATERIAL_CONFIG.emissive ?? 0x000000,
        emissiveIntensity: commonStore.BASE_CUBE_MATERIAL_CONFIG.emissiveIntensity ?? 1,
        ior: commonStore.BASE_CUBE_MATERIAL_CONFIG.ior ?? 1,
        transmission: commonStore.BASE_CUBE_MATERIAL_CONFIG.transmission ?? 1,
        metalness: commonStore.BASE_CUBE_MATERIAL_CONFIG.metalness ?? 1,
        roughness: commonStore.BASE_CUBE_MATERIAL_CONFIG.roughness ?? 1,
        thickness: commonStore.BASE_CUBE_MATERIAL_CONFIG.thickness ?? 1,
        ...materialConfig,
    };

    //
    // GLB
    //

    if (useGLB && geomConfig.modelUrl) {
      const model = await CubeBuilder.loadModel(geomConfig.modelUrl);

      cube = CubeBuilder.createCubeFromGLB(model, geomConfig);

      //
      // Если передан готовый материал — используем его
      //
      if (existingMaterial) {
        cube.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = existingMaterial;
          }
        });
      }
      //
      // ATLAS
      //
      else if (_materialConfig.atlas && _materialConfig.atlasSprite) {
        const atlasTexture = _materialConfig.atlas.getAtlasTexture();

        const sprite = _materialConfig.atlas.getSprite(
          _materialConfig.atlasSprite,
        );

        if (atlasTexture && sprite) {
          cube.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;

              //
              // CLONE GEOMETRY
              //

              mesh.geometry = mesh.geometry.clone();

              //
              // APPLY UV
              //

              const uv = mesh.geometry.attributes.uv;

              for (let i = 0; i < uv.count; i++) {
                const u = uv.getX(i);
                const v = uv.getY(i);

                uv.setXY(
                  i,
                  sprite.uvRect.u + u * sprite.uvRect.w,

                  sprite.uvRect.v + v * sprite.uvRect.h,
                );
              }

              uv.needsUpdate = true;

              //
              // MATERIAL
              //

              mesh.material = new THREE.MeshStandardMaterial({
                map: atlasTexture,

                color: _materialConfig.color ?? 0xffffff,

                emissive: _materialConfig.emissive ?? 0x000000,

                emissiveIntensity: _materialConfig.emissiveIntensity ?? 1,

                transparent: true,
              });
            }
          });
        }
      }
      //
      // NORMAL TEXTURE
      //
      else if (useTexture && _materialConfig.textureUrl) {
        const texture = loadTexture(_materialConfig.textureUrl);

        texture.flipY = false;

        cube.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;

            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,

              color: _materialConfig.color ?? 0xffffff,

              emissive: _materialConfig.emissive ?? 0x000000,

              emissiveIntensity: _materialConfig.emissiveIntensity ?? 1,

              transparent: true,
            });
          }
        });
      }

      //
      // PRIMITIVE
      //
    } else {
      let material: THREE.Material;

      // Если передан готовый материал — используем его
      if (existingMaterial) {
        material = existingMaterial;
      }
      //
      // ATLAS
      //
      else if (_materialConfig.atlas && _materialConfig.atlasSprite) {
        const atlasTexture = _materialConfig.atlas.getAtlasTexture();

        material = new THREE.MeshStandardMaterial({
          map: atlasTexture ?? null,

          color: _materialConfig.color,

          emissive: _materialConfig.emissive,

          emissiveIntensity: _materialConfig.emissiveIntensity,

          transparent: true,
        });
      }
      //
      // NORMAL TEXTURE
      //
      else if (useTexture && _materialConfig.textureUrl) {
        const texture = loadTexture(_materialConfig.textureUrl);

        material = new THREE.MeshStandardMaterial({
          map: texture,

          color: _materialConfig.color,

          emissive: _materialConfig.emissive,

          emissiveIntensity: _materialConfig.emissiveIntensity,

          transparent: true,
        });
      }
      //
      // NO TEXTURE
      //
      else {
        material = new THREE.MeshStandardMaterial({
          color: _materialConfig.color ?? 0xffffff,

          emissive: _materialConfig.emissive ?? 0x000000,

          emissiveIntensity: _materialConfig.emissiveIntensity ?? 1,

          transparent: true,
        });
      }

      //
      // CREATE PRIMITIVE
      //

      cube = CubeBuilder.createPrimitiveCube(
        geomConfig,
        material,
        _materialConfig,
      );
    }

    //
    // USER DATA
    //

    if (index !== undefined) {
      cube.userData = CubeBuilder.createCubeUserData(geomConfig, index);
    }

    return cube;
  }

  // ... остальные методы остаются без изменений ...
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

    cube.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return cube;
  }

  private static createPrimitiveCube(
    config: GeometryConfig,
    material: THREE.Material,
    materialConfig?: MaterialConfig,
  ): THREE.Mesh {
    let geometry = new THREE.BoxGeometry(1, 1, 1);

    //
    // APPLY ATLAS UV
    //

    if (materialConfig?.atlas && materialConfig.atlasSprite) {
      const sprite = materialConfig.atlas.getSprite(materialConfig.atlasSprite);

      if (sprite) {
        geometry = geometry.clone();

        const uv = geometry.attributes.uv;

        for (let i = 0; i < uv.count; i++) {
          const u = uv.getX(i);
          const v = uv.getY(i);

          uv.setXY(
            i,
            sprite.uvRect.u + u * sprite.uvRect.w,

            sprite.uvRect.v + v * sprite.uvRect.h,
          );
        }

        uv.needsUpdate = true;
      }
    }

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

      name: config.name ?? "default",
    };
  }
}