import texture from "@/assets/textures/cube_bullet.svg";
import modelUrl from "@/assets/models/cube.glb";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";

const SIZE = 0.3;

export const GEOMETRY_CONFIG: GeometryConfig = {
  scale: [SIZE, SIZE, SIZE],
  modelUrl: modelUrl,
};

export const MATERIAL_CONFIG: MaterialConfig = {
  textureUrl: texture,
  emissive: 0xdd0000,
  emissiveIntensity: 0.6,
};
