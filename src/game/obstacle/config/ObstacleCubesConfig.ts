import type { GeometryConfig } from "@/game/cube/types";
// assets
import cubeGLB from "@/assets/models/cube.glb";

const SCALING = 0.3;

const X_POSITION_OFFSET = 0.66;
const Y_POSITION = 0.3;
const Z_POSITION = 0;

export const OBSTACLE_FORMS: GeometryConfig[][] = [
  // Стена из трёх кубиков в ряд
  [
    // нижний ряд
    {
      pos: [-X_POSITION_OFFSET, Y_POSITION, Z_POSITION],
      scale: [SCALING, SCALING, SCALING],
      modelUrl: cubeGLB,
    },
    {
      pos: [0, Y_POSITION, Z_POSITION],
      scale: [SCALING, SCALING, SCALING],
      modelUrl: cubeGLB,
    },
    {
      pos: [X_POSITION_OFFSET, Y_POSITION, Z_POSITION],
      scale: [SCALING, SCALING, SCALING],
      modelUrl: cubeGLB,
    },
  ],
];
