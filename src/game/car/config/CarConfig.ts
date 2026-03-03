import * as THREE from "three";
import type { CarConfig } from "../types";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import base_texture from "@/assets/textures/cube_base.svg";

// Конфигурация кубиков машины
const AXIS_SIZE = 0.6;

const COLS: [number, number, number] = [-AXIS_SIZE, 0, AXIS_SIZE];
const ROWS: [number, number, number, number] = [
  (AXIS_SIZE * 3) / 2,
  (AXIS_SIZE * 1) / 2,
  (-AXIS_SIZE * 1) / 2,
  (-AXIS_SIZE * 3) / 2,
];
const HEIGHT = 0.17;
const GLB_SCALES: [number, number, number] = [
  AXIS_SIZE,
  (AXIS_SIZE * 2) / 3,
  AXIS_SIZE,
];

export const CAR_CUBES_CONFIG: GeometryConfig[] = [
  {
    pos: [COLS[1], HEIGHT, ROWS[3]],
    scale: GLB_SCALES,
    name: "задний-центр",
  },
  {
    pos: [COLS[0], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    name: "левый-2",
  },
  {
    pos: [COLS[1], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    name: "центр-2",
  },
  {
    pos: [COLS[2], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    name: "правый-2",
  },
  {
    pos: [COLS[1], HEIGHT, ROWS[1]],
    scale: GLB_SCALES,
    name: "центр-3",
  },
  {
    pos: [COLS[0], HEIGHT, ROWS[0]],
    scale: GLB_SCALES,
    name: "левый-передний",
  },
  {
    pos: [COLS[2], HEIGHT, ROWS[0]],
    scale: GLB_SCALES,
    name: "правый-передний",
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
  laneChangeSpeed: 0.2,
  maxTilt: 0.3,
  tiltSmoothing: 0.2,

  // Прыжки
  jumpHeight: 2.0,
  jumpDuration: 0.2,
  gravity: 0.015,

  // Разрушение
  explosionForce: 0.3,
  explosionUpward: 0.2,
  cubeRotationSpeed: 0.05,
  cubeGravity: 0.005,
  removalHeight: -5,
};
