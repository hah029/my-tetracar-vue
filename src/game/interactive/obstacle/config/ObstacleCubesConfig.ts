import type { GeometryConfig } from "@/game/cube/types";
// assets
import cubeGLB from "@/assets/models/cube.glb";
import { XZ_SCALING as XZSC } from "@/game/cube/config";

const YPOS = 0.15;
const ZPOS = 0;
const LXPS = -2 * XZSC;
const RXPS = 2 * XZSC;

export const OBSTACLE_FORMS: GeometryConfig[][] = [
  // Стена из трёх кубиков в ряд
  [
    // нижний ряд
    {
      pos: [LXPS, YPOS, ZPOS],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [0, YPOS, ZPOS],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [RXPS, YPOS, ZPOS],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
  ],

  // Стена из трёх кубиков в 2 ряда
  [
    // нижний ряд
    {
      pos: [LXPS, YPOS, ZPOS],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [0, YPOS, ZPOS],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [RXPS, YPOS, ZPOS],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    // средний ряд
    {
      pos: [LXPS, YPOS, ZPOS - XZSC * 2],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [0, YPOS, ZPOS - XZSC * 2],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [RXPS, YPOS, ZPOS - XZSC * 2],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
  ],

  // квадрат 3x3
  [
    // нижний ряд
    {
      pos: [LXPS, YPOS, ZPOS],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [0, YPOS, ZPOS],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [RXPS, YPOS, ZPOS],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    // средний ряд
    {
      pos: [LXPS, YPOS, ZPOS - XZSC * 2],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [0, YPOS, ZPOS - XZSC * 2],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [RXPS, YPOS, ZPOS - XZSC * 2],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    // верхний ряд
    {
      pos: [LXPS, YPOS, ZPOS - XZSC * 4],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [0, YPOS, ZPOS - XZSC * 4],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
    {
      pos: [RXPS, YPOS, ZPOS - XZSC * 4],
      scale: [XZSC, XZSC, XZSC],
      modelUrl: cubeGLB,
    },
  ],
];
