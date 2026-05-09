// import base_texture from "@/assets/textures/cube_gold.svg";
import cubeUrl from "@/assets/models/cube.glb";
import energonUrl from "@/assets/models/energon.glb";
import { XZ_SCALING } from "@/game/cube/config";
import type { GeometryConfig } from "@/game/cube/types";

export const ITEM_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
  modelUrl: cubeUrl,
};

export const ENERGON_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
  // modelUrl: energonUrl,
  modelUrl: cubeUrl,
};
