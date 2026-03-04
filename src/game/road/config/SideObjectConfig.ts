import modelUrl from "@/assets/models/cube.glb";
import type { GeometryConfig } from "@/game/cube/types";

const SIDE_OBJECT_SIZE = 0.3;

export const SIDE_OBJECT_GEOMETRY_CONFIG: GeometryConfig = {
  scale: [SIDE_OBJECT_SIZE, SIDE_OBJECT_SIZE, SIDE_OBJECT_SIZE],
  modelUrl: modelUrl,
};
