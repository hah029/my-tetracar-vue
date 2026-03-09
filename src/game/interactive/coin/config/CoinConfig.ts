import base_texture from "@/assets/textures/cube_gold.svg";
import modelUrl from "@/assets/models/cube.glb";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";

const COIN_SIZE = 0.3;

export const COIN_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [COIN_SIZE, COIN_SIZE, COIN_SIZE],
  modelUrl: modelUrl,
};

export const COIN_MATERIAL_CONFIG: MaterialConfig = {
  textureUrl: base_texture,
};
