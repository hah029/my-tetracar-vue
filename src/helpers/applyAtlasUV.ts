// helpers/applyAtlasUV.ts

import * as THREE from "three";
import type { AtlasSprite } from "@/assets/textures/TextureAtlas";

export type BoxFace = "right" | "left" | "top" | "bottom" | "front" | "back";

export interface AtlasRegion {
  /**
   * Normalized rectangle inside the selected atlas sprite.
   * Coordinates use the same top-left layout as TexturePacker JSON.
   */
  x: number;
  y: number;
  w: number;
  h: number;
  flipU?: boolean;
  flipV?: boolean;
}

export type BoxAtlasRegions = Partial<Record<BoxFace, AtlasRegion>>;

const BOX_FACE_UV_START: Record<BoxFace, number> = {
  right: 0,
  left: 4,
  top: 8,
  bottom: 12,
  front: 16,
  back: 20,
};

export const CUBE_SPRITE_REGIONS = {
  topIcon: { x: 0, y: 0, w: 0.5, h: 0.5 } satisfies AtlasRegion,
  sideTop: { x: 0.5, y: 0, w: 0.5, h: 0.25, flipV: true } satisfies AtlasRegion,
  sideUpper: {
    x: 0.5,
    y: 0.25,
    w: 0.5,
    h: 0.25,
    flipV: true,
  } satisfies AtlasRegion,
  sideLower: {
    x: 0.5,
    y: 0.5,
    w: 0.5,
    h: 0.25,
    flipV: true,
  } satisfies AtlasRegion,
  sideBottom: {
    x: 0.5,
    y: 0.75,
    w: 0.5,
    h: 0.25,
    flipV: true,
  } satisfies AtlasRegion,
};

export function applyAtlasSpriteUV(
  geometry: THREE.BufferGeometry,
  sprite: AtlasSprite,
): THREE.BufferGeometry {
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
  return geometry;
}

export function applyAtlasUV(
  geometry: THREE.BufferGeometry,
  sprite: AtlasSprite,
): THREE.BufferGeometry {
  return applyAtlasSpriteUV(geometry, sprite);
}

export function applyBoxAtlasRegionsUV(
  geometry: THREE.BufferGeometry,
  sprite: AtlasSprite,
  faceRegions: BoxAtlasRegions,
): THREE.BufferGeometry {
  const uv = geometry.attributes.uv;

  for (const [face, region] of Object.entries(faceRegions) as [
    BoxFace,
    AtlasRegion,
  ][]) {
    const start = BOX_FACE_UV_START[face];

    for (let i = start; i < start + 4; i++) {
      const u = uv.getX(i);
      const v = uv.getY(i);
      const localU = region.flipU ? 1 - u : u;
      const localV = region.flipV ? 1 - v : v;

      uv.setXY(
        i,
        sprite.uvRect.u + (region.x + localU * region.w) * sprite.uvRect.w,
        sprite.uvRect.v + (region.y + localV * region.h) * sprite.uvRect.h,
      );
    }
  }

  uv.needsUpdate = true;
  return geometry;
}

export function applyCubeSpriteUV(
  geometry: THREE.BufferGeometry,
  sprite: AtlasSprite,
): THREE.BufferGeometry {
  return applyBoxAtlasRegionsUV(geometry, sprite, {
    top: CUBE_SPRITE_REGIONS.topIcon,
    bottom: CUBE_SPRITE_REGIONS.sideBottom,
    right: CUBE_SPRITE_REGIONS.sideTop,
    left: CUBE_SPRITE_REGIONS.sideUpper,
    front: CUBE_SPRITE_REGIONS.sideLower,
    back: CUBE_SPRITE_REGIONS.sideBottom,
  });
}
