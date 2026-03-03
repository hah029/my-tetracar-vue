import * as THREE from "three";


export interface CarState {
  isJumping: boolean;
  jumpVelocity: number;
  targetPitch: number;
  isDestroyed: boolean;
  cubes: THREE.Object3D[];
}

export interface CarConfig {
  // Позиционирование
  startPosition?: THREE.Vector3;
  startLane?: number;

  // Размеры и коллайдер
  colliderShrinkX?: number;
  colliderShrinkZ?: number;
  colliderYOffset?: number;
  colliderHeightFactor?: number;

  // Управление
  laneChangeSpeed?: number;
  maxTilt?: number;
  tiltSmoothing?: number;

  // Прыжки
  jumpHeight?: number;
  jumpDuration?: number;
  gravity?: number;

  // Разрушение
  explosionForce?: number;
  explosionUpward?: number;
  cubeRotationSpeed?: number;
  cubeGravity?: number;
  removalHeight?: number;
}

export interface CarStats {
  currentLane: number;
  position: THREE.Vector3;
  isDestroyed: boolean;
  isJumping: boolean;
  cubesCount: number;
}
