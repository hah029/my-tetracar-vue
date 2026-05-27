// helpers/applyAtlasUV.ts

import * as THREE from "three";
import { AtlasSprite } from "@/helpers/TextureAtlas";

export function applyAtlasUV(
  geometry: THREE.BufferGeometry,
  sprite: AtlasSprite,
): void {
  geometry = geometry.clone();

  const uv = geometry.attributes.uv;

  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);

    uv.setXY(
      i,
      sprite.uvRect.u + u * sprite.uvRect.w,
      sprite.uvRect.v + v * sprite.uvRect.h,
    );
  }

  uv.needsUpdate = true;
}
