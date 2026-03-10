import modelUrl from "@/assets/models/cube.glb";
import base_texture from "@/assets/textures/cube_base.svg";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";

const SIDE_OBJECT_SIZE = 0.3;

export const SIDE_OBJECT_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [SIDE_OBJECT_SIZE, SIDE_OBJECT_SIZE, SIDE_OBJECT_SIZE],
  modelUrl: modelUrl,
};

export const SIDE_OBJECT_MATERIAL_CONFIG: MaterialConfig = {
  textureUrl: base_texture,
};
