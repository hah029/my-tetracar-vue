import * as THREE from "three";


export interface CubeConfig {
    pos: [number, number, number];
    scale: [number, number, number];
    color: number;
    name?: string;
    textureUrl?: string;
}

export interface CubeUserData {
    originalPos: number[];
    originalScale: number[];
    configIndex: number;
    velocity: THREE.Vector3;
    rotationSpeed: THREE.Vector3;
}