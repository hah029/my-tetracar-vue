import { atlas } from "@/assets/textures/TextureAtlas";
import { ATLAS_SPRITES } from "@/assets/textures/atlasSprites";
import type { MaterialConfig } from "@/game/cube/types";
import type { TextureMap } from "@/game/car/CarVisualState";

export interface NeonEdgesSkinEffect {
  enabled: boolean;
  color: number | string;
  intensity: number;
  thresholdAngle?: number;
}

/**
 * Only fields present in a skin override the standard car configuration.
 * An absent or unknown skin therefore always renders as the default black car.
 */
export interface PlayerSkinConfig {
  material?: Partial<MaterialConfig>;
  textures?: Partial<TextureMap>;
  effects?: {
    neonEdges?: NeonEdgesSkinEffect;
  };
}

export const PLAYER_SKINS: Record<string, PlayerSkinConfig> = {
  basic1: {
    material: {
      atlas,
      atlasSprite: ATLAS_SPRITES.cube.base,
      color: 0x6688aa,
    },
    textures: { default: ATLAS_SPRITES.cube.energon },
  },
  basic2: {
    material: {
      atlas,
      atlasSprite: ATLAS_SPRITES.cube.base,
      color: 0xaa6688,
    },
    textures: { default: ATLAS_SPRITES.cube.gold },
  },
  premium1: {
    material: {
      atlas,
      atlasSprite: ATLAS_SPRITES.cube.base,
      color: 0x66dfff,
    },
    textures: { default: ATLAS_SPRITES.cube.energon },
    effects: {
      neonEdges: {
        enabled: true,
        color: 0x00eaff,
        intensity: 5,
        thresholdAngle: 25,
      },
    },
  },
  premium2: {
    material: {
      atlas,
      atlasSprite: ATLAS_SPRITES.cube.base,
      color: 0xd070ff,
    },
    textures: { default: ATLAS_SPRITES.cube.magnet },
  },
};

export function getPlayerSkinConfig(
  skinId: string | null | undefined,
): PlayerSkinConfig | null {
  return skinId ? PLAYER_SKINS[skinId] ?? null : null;
}
