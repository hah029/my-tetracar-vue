// import base_texture from "@/assets/textures/cube_gold.svg";
import modelUrl from "@/assets/models/cube.glb";
import type { GeometryConfig } from "@/game/cube/types";

const SIZE = 0.3;

export const ITEM_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [SIZE, SIZE, SIZE],
  modelUrl: modelUrl,
};
