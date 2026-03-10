import * as THREE from "three";

export interface GeometryConfig {
  pos?: [number, number, number];
  scale: [number, number, number];
  name?: string;
  modelUrl?: string;
}
export interface MaterialConfig {
  textureUrl?: string;
  color?: number;
  emissive?: number;
  emissiveIntensity?: number;
}

export interface CubeUserData {
  originalPos: number[];
  originalScale: number[];
  configIndex: number | null;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  name?: string;
}
