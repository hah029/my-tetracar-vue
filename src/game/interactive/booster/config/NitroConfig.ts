// import base_texture from "@/assets/textures/cube_gold.svg";
import modelUrl from "@/assets/models/cube.glb";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";

const SIZE = 0.6;

export const NITRO_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [SIZE, SIZE * 0.5, SIZE],
  modelUrl: modelUrl,
};

export const NITRO_MATERIAL_CONFIG: MaterialConfig = {
  // textureUrl: base_texture,
  color: 0x00ff00,
};
