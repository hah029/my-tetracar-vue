import * as THREE from "three";

export interface ColliderConfig {
  shrinkX: number;
  shrinkZ: number;
  yOffset: number;
  heightFactor: number;
}

export class CarCollider {
  private collider: THREE.Box3;
  private boundingBox: THREE.Box3;
  private config: ColliderConfig;

  constructor(config: ColliderConfig) {
    this.collider = new THREE.Box3();
    this.boundingBox = new THREE.Box3();
    this.config = config;
  }

  public updateFromObject(obj: THREE.Object3D): void {
    this.boundingBox.setFromObject(obj);
    
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    
    this.boundingBox.getSize(size);
    this.boundingBox.getCenter(center);

    const colliderSize = new THREE.Vector3(
      size.x * this.config.shrinkX,
      size.y * this.config.heightFactor,
      size.z * this.config.shrinkZ
    );

    const colliderCenter = new THREE.Vector3(
      center.x,
      center.y - this.config.yOffset,
      center.z
    );

    const halfSize = colliderSize.clone().multiplyScalar(0.4);
    this.collider.min.copy(colliderCenter.clone().sub(halfSize));
    this.collider.max.copy(colliderCenter.clone().add(halfSize));
  }

  public getCollider(): THREE.Box3 {
    return this.collider;
  }

  public checkObstacleCollision(obstacle: THREE.Object3D): boolean {
    const obstacleBox = new THREE.Box3().setFromObject(obstacle);
    return this.collider.intersectsBox(obstacleBox);
  }

  public checkJumpCollision(jump: THREE.Object3D, carPosition: THREE.Vector3): boolean {
    const jumpBox = new THREE.Box3().setFromObject(jump);
    const xDistance = Math.abs(carPosition.x - jump.position.x);
    if (xDistance > 1.2) return false;
    const zDistance = Math.abs(carPosition.z - jump.position.z);
    if (zDistance > 1.5) return false;
    
    return this.collider.intersectsBox(jumpBox);
  }

  public createDebugCollider(scene: THREE.Scene): { debugMesh: THREE.Mesh; updateDebug: () => void } {
    const oldDebug = scene.getObjectByName('debugCollider');
    if (oldDebug) scene.remove(oldDebug);

    const debugGeo = new THREE.BoxGeometry(1, 1, 1);
    const debugMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    
    const debugMesh = new THREE.Mesh(debugGeo, debugMat);
    debugMesh.name = 'debugCollider';

    const updateDebug = () => {
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      this.collider.getSize(size);
      this.collider.getCenter(center);

      debugMesh.scale.copy(size);
      debugMesh.position.copy(center);
    };

    scene.add(debugMesh);
    return { debugMesh, updateDebug };
  }
}