import base_texture from "@/assets/textures/cube_base.svg";

import type { MaterialConfig } from "@/game/cube/types";

export const MAGNET_MATERIAL_CONFIG: MaterialConfig = {
  textureUrl: base_texture,
  // color: 0x00ff00,
  emissive: 0x000000,
  emissiveIntensity: 0.6,
};
