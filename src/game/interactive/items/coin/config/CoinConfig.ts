import coin_texture from "@/assets/textures/cube_gold.svg";
import diamond_texture from "@/assets/textures/cube_diamond.svg";
import modelUrl from "@/assets/models/cube.glb";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";

const COIN_SIZE = 0.3;

export const COIN_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [COIN_SIZE, COIN_SIZE, COIN_SIZE],
  modelUrl: modelUrl,
};

export const COIN_MATERIAL_CONFIG: MaterialConfig = {
  textureUrl: coin_texture,
};

export const DIAMOND_MATERIAL_CONFIG: MaterialConfig = {
  textureUrl: diamond_texture,
};
