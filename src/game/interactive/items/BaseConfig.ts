// import base_texture from "@/assets/textures/cube_gold.svg";
import cubeUrl from "@/assets/models/cube.glb";
import energonUrl from "@/assets/models/energon.glb";
import type { GeometryConfig } from "@/game/cube/types";

const SIZE = 0.3;

export const ITEM_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [SIZE, SIZE, SIZE],
  modelUrl: cubeUrl,
};

export const ENERGON_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [SIZE, SIZE, SIZE],
  modelUrl: energonUrl,
};
