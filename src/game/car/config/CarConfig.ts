import * as THREE from "three";
import { type CarConfig, type CubeConfig } from "../types";

// Конфигурация кубиков машины
const COLS: [number, number, number] = [-0.6, 0, 0.6];
const ROWS: [number, number, number, number] = [0.84, 0.3, -0.3, -0.84];
const HEIGHT = 0.17;
// const GLB_SCALES: [number, number, number] = [0.5, 0.5, 0.5];
const GLB_SCALES: [number, number, number] = [0.3, 0.3, 0.3];

export const CAR_CUBES_CONFIG: CubeConfig[] = [
  {
    pos: [COLS[1], HEIGHT, ROWS[3]],
    scale: GLB_SCALES,
    color: 0xff4444,
    name: "задний-центр",
  },
  {
    pos: [COLS[0], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    color: 0xff6666,
    name: "левый-2",
  },
  {
    pos: [COLS[1], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    color: 0xff6666,
    name: "центр-2",
  },
  {
    pos: [COLS[2], HEIGHT, ROWS[2]],
    scale: GLB_SCALES,
    color: 0xff6666,
    name: "правый-2",
  },
  {
    pos: [COLS[1], HEIGHT, ROWS[1]],
    scale: GLB_SCALES,
    color: 0xff8888,
    name: "центр-3",
  },
  {
    pos: [COLS[0], HEIGHT, ROWS[0]],
    scale: GLB_SCALES,
    color: 0x44aaff,
    name: "левый-передний",
  },
  {
    pos: [COLS[2], HEIGHT, ROWS[0]],
    scale: GLB_SCALES,
    color: 0x44aaff,
    name: "правый-передний",
  },
];

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
