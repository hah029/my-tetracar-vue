import * as THREE from "three";
import type { CarConfig } from "../types";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import base_texture from "@/assets/textures/cube_base.svg";
import cubeGLB from "@/assets/models/cube.glb";
import { XZ_SCALING } from "@/game/cube/config";

const COLS: [number, number, number] = [-XZ_SCALING * 2, 0, XZ_SCALING * 2];
const ROWS: [number, number, number, number] = [
  XZ_SCALING * 3,
  XZ_SCALING,
  -XZ_SCALING,
  -XZ_SCALING * 3,
];
const HEIGHT = 0.17;
const GLB_SCALES: [number, number, number] = [
  XZ_SCALING,
  XZ_SCALING,
  XZ_SCALING,
];

export const CAR_CUBES_CONFIG: GeometryConfig[] = [
  {
    pos: [COLS[1], HEIGHT, ROWS[3]],
    scale: GLB_SCALES,
    name: "задний-центр",
    modelUrl: cubeGLB,
  },
  {
    pos: [COLS[0], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    name: "левый-2",
    modelUrl: cubeGLB,
  },
  {
    pos: [COLS[1], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    name: "центр-2",
    modelUrl: cubeGLB,
  },
  {
    pos: [COLS[2], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    name: "правый-2",
    modelUrl: cubeGLB,
  },
  {
    pos: [COLS[1], HEIGHT, ROWS[1]],
    scale: GLB_SCALES,
    name: "центр-3",
    modelUrl: cubeGLB,
  },
  {
    pos: [COLS[0], HEIGHT, ROWS[0]],
    scale: GLB_SCALES,
    name: "левый-передний",
    modelUrl: cubeGLB,
  },
  {
    pos: [COLS[2], HEIGHT, ROWS[0]],
    scale: GLB_SCALES,
    name: "правый-передний",
    modelUrl: cubeGLB,
  },
];

export const CAR_MATERIAL_CONFIG: MaterialConfig = {
  textureUrl: base_texture,
};

// Конфигурация машины по умолчанию
export const DEFAULT_CAR_CONFIG: Required<CarConfig> = {
  // Позиционирование
  startPosition: new THREE.Vector3(0, 0.25, 3),
  startLane: 1,

  // Размеры и коллайдер
  colliderShrinkX: 0.5,
  colliderShrinkZ: 0.5,
  colliderYOffset: 0.0,
  colliderHeightFactor: 0.8,

  // Управление
  laneChangeSpeed: 0.3,
  maxTilt: 0.4,
  tiltSmoothing: 0.1,

  // Прыжки
  jumpHeight: 2.0,
  jumpDuration: 0.2,
  gravity: 0.015,

  // Разрушение
  explosionForce: 0.2,
  explosionUpward: 0.2,
  cubeRotationSpeed: 0.05,
  cubeGravity: 0.005,
  removalHeight: 0,
};
