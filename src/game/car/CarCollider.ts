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
  public debugMesh: THREE.Mesh | null = null;

  constructor(config: ColliderConfig) {
    this.collider = new THREE.Box3();
    this.boundingBox = new THREE.Box3();
    this.config = config;
  }

  public updateFromObject(obj: THREE.Object3D): void {
    // Принудительно обновляем мировые матрицы всех дочерних объектов
    obj.updateWorldMatrix(false, true);

    this.boundingBox.setFromObject(obj);

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    this.boundingBox.getSize(size);
    this.boundingBox.getCenter(center);

    const colliderSize = new THREE.Vector3(
      size.x * this.config.shrinkX,
      size.y * this.config.heightFactor,
      size.z * this.config.shrinkZ,
    );

    const colliderCenter = new THREE.Vector3(
      center.x,
      center.y - this.config.yOffset,
      center.z,
    );

    const halfSize = colliderSize.clone().multiplyScalar(0.4);
    this.collider.min.copy(colliderCenter.clone().sub(halfSize));
    this.collider.max.copy(colliderCenter.clone().add(halfSize));

    // Логирование для отладки
    console.log(
      `[CarCollider] updateFromObject: boundingBox size=${size.toArray()}, center=${center.toArray()}`,
    );
    console.log(
      `[CarCollider] collider size=${colliderSize.toArray()}, center=${colliderCenter.toArray()}`,
    );
    console.log(
      `[CarCollider] debugMesh exists? ${this.debugMesh ? "yes" : "no"}`,
    );

    // Обновляем отладочный меш, если он есть
    if (this.debugMesh) {
      const currentSize = new THREE.Vector3();
      const currentCenter = new THREE.Vector3();
      this.collider.getSize(currentSize);
      this.collider.getCenter(currentCenter);

      console.log(
        `[CarCollider] updating debug mesh, size=${currentSize.toArray()}, center=${currentCenter.toArray()}`,
      );

      this.debugMesh.scale.copy(currentSize);
      this.debugMesh.position.copy(currentCenter);
    }
  }

  public getCollider(): THREE.Box3 {
    return this.collider;
  }

  public checkObstacleCollision(obstacle: THREE.Object3D): boolean {
    // Логируем только для EnemyCar
    const isEnemyCar = obstacle.constructor.name === "EnemyCar";
    // if (isEnemyCar) {
    //   // console.log(
    //   //   `[CarCollider] Checking collision with EnemyCar at`,
    //   //   obstacle.position,
    //   // );
    // }

    // Попробуем получить коллайдер через getCollider, если он есть
    let obstacleBox: THREE.Box3 | null = null;
    if (
      (obstacle as any).getCollider &&
      typeof (obstacle as any).getCollider === "function"
    ) {
      obstacleBox = (obstacle as any).getCollider();
      // if (isEnemyCar) {
      //   console.log(
      //     `[CarCollider] EnemyCar box from getCollider:`,
      //     obstacleBox,
      //   );
      // }
    }
    if (!obstacleBox) {
      obstacleBox = new THREE.Box3().setFromObject(obstacle);
      // if (isEnemyCar) {
      //   console.log(
      //     `[CarCollider] EnemyCar box from setFromObject:`,
      //     obstacleBox,
      //   );
      // }
    }

    if (isEnemyCar) {
      const carSize = new THREE.Vector3();
      const carCenter = new THREE.Vector3();
      this.collider.getSize(carSize);
      this.collider.getCenter(carCenter);
      // console.log(
      //   `[CarCollider] Car collider center:`,
      //   carCenter,
      //   `size:`,
      //   carSize,
      // );
      const obsSize = new THREE.Vector3();
      const obsCenter = new THREE.Vector3();
      obstacleBox.getSize(obsSize);
      obstacleBox.getCenter(obsCenter);
      // console.log(
      //   `[CarCollider] EnemyCar box center:`,
      //   obsCenter,
      //   `size:`,
      //   obsSize,
      // );
    }

    const intersects = this.collider.intersectsBox(obstacleBox);
    // if (isEnemyCar) {
    //   console.log(`[CarCollider] Intersects? ${intersects}`);
    // }
    return intersects;
  }

  public checkJumpCollision(
    jump: THREE.Object3D,
    carPosition: THREE.Vector3,
  ): boolean {
    const jumpBox = new THREE.Box3().setFromObject(jump);
    const xDistance = Math.abs(carPosition.x - jump.position.x);
    if (xDistance > 1.2) return false;
    const zDistance = Math.abs(carPosition.z - jump.position.z);
    if (zDistance > 1.5) return false;

    return this.collider.intersectsBox(jumpBox);
  }

  // Включение визуализации коллайдера
  public enableDebug(scene: THREE.Scene): void {
    console.log(
      `[CarCollider] enableDebug called, scene=${scene?.uuid}, collider empty?`,
      this.collider.isEmpty(),
    );
    if (this.debugMesh) {
      console.log(`[CarCollider] removing existing debug mesh`);
      scene.remove(this.debugMesh);
    }
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    this.debugMesh = new THREE.Mesh(geometry, material);
    this.debugMesh.name = "carDebugCollider";
    this.debugMesh.renderOrder = 999; // Рендерить поверх других объектов

    // Сразу устанавливаем позицию и масштаб из текущего коллайдера
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    this.collider.getSize(size);
    this.collider.getCenter(center);
    console.log(
      `[CarCollider] collider size=${size.toArray()}, center=${center.toArray()}`,
    );
    this.debugMesh.scale.copy(size);
    this.debugMesh.position.copy(center);

    scene.add(this.debugMesh);
    console.log(
      `[CarCollider] debug mesh added to scene, mesh id=${this.debugMesh.id}, parent=${this.debugMesh.parent?.uuid}`,
    );

    // Для отладки выведем информацию
    console.log(
      "[CarCollider] Debug mesh enabled, size:",
      size,
      "center:",
      center,
    );
  }

  // Выключение визуализации
  public disableDebug(scene: THREE.Scene): void {
    if (this.debugMesh) {
      scene.remove(this.debugMesh);
      this.debugMesh = null;
    }
  }
}
