// assets.ts

import cubeUrl from "./cube.glb";
import obstacle1x3 from "./cube_obstacle_1x3.glb";
import obstacle2x3 from "./cube_obstacle_2x3.glb";
import obstacle3x3 from "./cube_obstacle_3x3.glb";

export const MODELS = {
  cube: cubeUrl,
  obstacle1x3: obstacle1x3,
  obstacle2x3: obstacle2x3,
  obstacle3x3: obstacle3x3,
} as const;
