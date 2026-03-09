import * as THREE from "three";

export interface ObstacleConfig {
  lane: number;
  variant: number;
  baseColor: THREE.Color;
  pulseSpeed: number;
  pulsePhase: number;
}

export interface ObstaclePatternOptions {
  zPos?: number;
  pattern?: "wall" | "zigzag" | "random";
  count?: number;
  spacing?: number;
}
