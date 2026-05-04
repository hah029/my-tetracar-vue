import golden_texture from "@/assets/textures/cube_gold.svg";
import modelUrl from "@/assets/models/cube.glb";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";

const COIN_SIZE = 0.3;

export const COIN_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [COIN_SIZE, COIN_SIZE, COIN_SIZE],
  modelUrl: modelUrl,
};

export const GOLDEN_MATERIAL_CONFIG: MaterialConfig = {
  textureUrl: golden_texture,
  emissive: 0xefbf04,
  emissiveIntensity: 0.6,
  metalness: 4.0,
};

export const ENERGON_MATERIAL_CONFIG: MaterialConfig = {
  emissive: 0x82c8e5,
  emissiveIntensity: 0.6,
  metalness: 0,
};
