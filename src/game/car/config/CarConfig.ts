import * as THREE from "three";
import type { CarConfig } from "../types";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import { XZ_SCALING } from "@/game/cube/config";
// models
import cubeGLB from "@/assets/models/cube.glb";
// texture
import base_texture from "@/assets/textures/cube_base.svg";
import nitro_texture from "@/assets/textures/cube_nitro.svg";
import shield_texture from "@/assets/textures/cube_armor.svg";
import damage_texture from "@/assets/textures/cube_bullet.svg";

const COLS: [number, number, number] = [-XZ_SCALING * 2, 0, XZ_SCALING * 2];
const ROWS: [number, number, number, number] = [
  XZ_SCALING * 3,
  XZ_SCALING,
  -XZ_SCALING,
  -XZ_SCALING * 3,
];
const HEIGHT = 0.15;
const GLB_SCALES: [number, number, number] = [
  XZ_SCALING,
  XZ_SCALING,
  XZ_SCALING,
];

export const CAR_CUBES_CONFIG: GeometryConfig[] = [
  {
    pos: [COLS[1], HEIGHT, ROWS[3]],
    scale: GLB_SCALES,
    name: "shield",
    modelUrl: cubeGLB,
  },

  {
    pos: [COLS[1], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    name: "default",
    modelUrl: cubeGLB,
  },

  {
    pos: [COLS[1], HEIGHT, ROWS[1]],
    scale: GLB_SCALES,
    name: "default",
    modelUrl: cubeGLB,
  },
  // передние колеса
  {
    pos: [COLS[0], HEIGHT, ROWS[0]],
    scale: GLB_SCALES,
    name: "nitro",
    modelUrl: cubeGLB,
  },
  {
    pos: [COLS[2], HEIGHT, ROWS[0]],
    scale: GLB_SCALES,
    name: "nitro",
    modelUrl: cubeGLB,
  },
  // передние колеса
  {
    pos: [COLS[2], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    name: "nitro",
    modelUrl: cubeGLB,
  },
  {
    pos: [COLS[0], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    name: "nitro",
    modelUrl: cubeGLB,
  },
];

export const CAR_MATERIAL_CONFIG: MaterialConfig = {
  textureUrl: base_texture,
};

export const CAR_MATERIAL_CONFIG_EXTRA = {
  default: base_texture,
  nitro: nitro_texture,
  shield: shield_texture,
  damage: damage_texture,
};

// Конфигурация машины по умолчанию
export const DEFAULT_CAR_CONFIG: Required<CarConfig> = {
  // Позиционирование
  startPosition: new THREE.Vector3(0, 0, 0),
  startLane: 2,

  // Размеры и коллайдер
  colliderShrinkX: 1.0,
  colliderShrinkZ: 1.0,
  colliderYOffset: 0.0,
  colliderHeightFactor: 0.8,

  // Управление
  laneChangeSpeed: 0.5,
  maxTilt: 0.1,
  tiltSmoothing: 0.1,

  // Прыжки
  jumpHeight: 2.0,
  jumpDuration: 0.2,
  gravity: 0.01,

  // Разрушение
  explosionForce: 0.2,
  explosionUpward: 0.2,
  cubeRotationSpeed: 0.05,
  cubeGravity: 0.005,
  removalHeight: 0,
};
