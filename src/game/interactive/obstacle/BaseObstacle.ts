import * as THREE from "three";

export abstract class BaseObstacle extends THREE.Group {
  abstract update(dt: number, speed: number): boolean;
  abstract destroy(impact?: THREE.Vector3): void;
  abstract getCollider(): THREE.Box3 | null;
  abstract isFullyDestroyed(): boolean;
  abstract getCubes(): THREE.Object3D[];
  abstract getLane(): number;
}
