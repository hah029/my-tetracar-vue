// assets.ts
import baseCube from "./cube_base.svg";

import shieldTexture from "./cube_armor.svg";
import goldenTexture from "./cube_gold.svg";
import nitroTexture from "./cube_nitro.svg";
import bulletTexture from "./cube_bullet.svg";
import energonTexture from "./cube_energon.svg";
import magnetTexture from "./cube_magnet.svg";
import obstacle3x3Texture from "./cube_obstacle_3x.svg";

export const TEXTURES = {
  cube: {
    base: baseCube,
    // coins
    golden: goldenTexture,
    energon: energonTexture,
    // boosters
    shield: shieldTexture,
    nitro: nitroTexture,
    bullet: bulletTexture,
    megnet: magnetTexture,

    obstacle3x3: obstacle3x3Texture,
  },
} as const;
