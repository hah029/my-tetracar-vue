import base_texture from "@/assets/textures/cube_nitro.svg";

import type { MaterialConfig } from "@/game/cube/types";

export const NITRO_MATERIAL_CONFIG: MaterialConfig = {
  textureUrl: base_texture,
  // color: 0x00ff00,
  emissive: 0x00dd00,
  emissiveIntensity: 0.6,
};
