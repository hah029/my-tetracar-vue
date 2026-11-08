import type { MaterialConfig } from "@/game/cube/types";
import { atlas } from "@/assets/textures/TextureAtlas";
import { ITEM_ATLAS_SPRITES } from "@/assets/textures/atlasSprites";

export const magnetMaterialConfig = {
  atlas,
  atlasSprite: ITEM_ATLAS_SPRITES.magnet,
  emissive: 0x000000,
  emissiveIntensity: 0.6,
} as MaterialConfig;

export const bulletMaterialConfig = {
  atlas,
  atlasSprite: ITEM_ATLAS_SPRITES.bullet,
  emissive: 0xdd0000,
  emissiveIntensity: 0.6,
} as MaterialConfig;

export const nitroMaterialConfig = {
  atlas,
  atlasSprite: ITEM_ATLAS_SPRITES.nitro,
  emissive: 0x00dd00,
  emissiveIntensity: 0.6,
} as MaterialConfig;

export const shieldMaterialConfig = {
  atlas,
  atlasSprite: ITEM_ATLAS_SPRITES.shield,
  emissive: 0xffffff,
  emissiveIntensity: 0.6,
} as MaterialConfig;

export const goldenMaterialConfig = {
  atlas,
  atlasSprite: ITEM_ATLAS_SPRITES.golden,
  emissive: 0xefbf04,
  emissiveIntensity: 2,
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
