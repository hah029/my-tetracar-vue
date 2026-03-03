import type { GeometryConfig } from "@/game/cube/types";
// assets
import cubeGLB from "@/assets/models/cube.glb";
import { XZ_SCALING } from "@/game/cube/config";

const Y_POSITION = 0.3;
const Z_POSITION = 0;

export const OBSTACLE_FORMS: GeometryConfig[][] = [
  // Стена из трёх кубиков в ряд
  [
    // нижний ряд
    {
      pos: [-2 * XZ_SCALING, Y_POSITION, Z_POSITION],
      scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
      modelUrl: cubeGLB,
    },
    {
      pos: [0, Y_POSITION, Z_POSITION],
      scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
      modelUrl: cubeGLB,
    },
    {
      pos: [2 * XZ_SCALING, Y_POSITION, Z_POSITION],
      scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
      modelUrl: cubeGLB,
    },
  ],
];
