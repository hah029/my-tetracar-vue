import modelUrl from "@/assets/models/cube.glb";
import base_texture from "@/assets/textures/cube_base.svg";
import { XZ_SCALING } from "@/game/cube/config";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";

export const SIDE_OBJECT_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
  modelUrl: modelUrl,
};

export const SIDE_OBJECT_MATERIAL_CONFIG: MaterialConfig = {
  textureUrl: base_texture,
};
