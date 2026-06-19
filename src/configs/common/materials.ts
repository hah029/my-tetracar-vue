import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import { TEXTURES } from "@/assets/textures";

export const magnetMaterialConfig = {
  textureUrl: TEXTURES.cube.base,
  emissive: 0x000000,
  emissiveIntensity: 0.6,
} as MaterialConfig;

export const bulletMaterialConfig = {
  textureUrl: TEXTURES.cube.bullet,
  emissive: 0xdd0000,
  emissiveIntensity: 0.6,
} as MaterialConfig;

export const nitroMaterialConfig = {
  textureUrl: TEXTURES.cube.base,
  emissive: 0x00dd00,
  emissiveIntensity: 0.6,
} as MaterialConfig;

export const shieldMaterialConfig = {
  textureUrl: TEXTURES.cube.base,
  emissive: 0xffffff,
  emissiveIntensity: 0.6,
} as MaterialConfig;

export const goldenMaterialConfig = {
  textureUrl: TEXTURES.cube.golden,
  emissive: 0xefbf04,
  emissiveIntensity: 0.6,
  metalness: 4.0,
} as MaterialConfig;

// Базовый материал куба
export const baseCubeMaterialConfig = {
  color: 0xffffff,
  emissive: 0x000000,
  emissiveIntensity: 1,
  ior: 1,
  transmission: 1,
  metalness: 1,
  roughness: 1,
  thickness: 1,
} as MaterialConfig;
