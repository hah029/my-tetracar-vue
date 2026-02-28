import * as THREE from "three";
import { type CarConfig } from "./types";
import { DEFAULT_CAR_CONFIG } from "./config";

export class CarPhysics {
  private config: Required<CarConfig>;
  
  // Состояние прыжка
  private isJumping: boolean = false;
  private jumpVelocity: number = 0;
  private targetPitch: number = 0;
  private originalY: number = 0;

  constructor(config: Partial<CarConfig> = {}) {
    this.config = { ...DEFAULT_CAR_CONFIG, ...config };
  }

  public startJump(): void {
    if (this.isJumping) return;
    
    this.isJumping = true;
    this.jumpVelocity = Math.sqrt(2 * this.config.gravity * this.config.jumpHeight);
    this.targetPitch = 0.2;
  }

  public updateJump(currentY: number): { newY: number; isJumping: boolean; pitch: number } {
    if (!this.isJumping) {
      return { newY: currentY, isJumping: false, pitch: 0 };
    }

    let newY = currentY + this.jumpVelocity;
    this.jumpVelocity -= this.config.gravity;

    // Плавный наклон при прыжке
    this.targetPitch = this.jumpVelocity > 0 ? 0.2 : -0.1;

    if (newY <= this.originalY) {
      newY = this.originalY;
      this.isJumping = false;
      this.jumpVelocity = 0;
      this.targetPitch = 0;
    }

    return {
      newY,
      isJumping: this.isJumping,
      pitch: this.targetPitch
    };
  }

  public updateLaneMovement(
    currentX: number,
    targetX: number,
    currentRotationY: number
  ): { newX: number; newRotationY: number } {
    const deltaX = targetX - currentX;
    
    if (isNaN(deltaX)) {
      return { newX: currentX, newRotationY: currentRotationY };
    }

    const newX = currentX + deltaX * this.config.laneChangeSpeed;
    const newRotationY = currentRotationY + 
      (-deltaX * this.config.maxTilt - currentRotationY) * this.config.tiltSmoothing;

    return { newX, newRotationY };
  }

  public createExplosionCubes(
    cubes: THREE.Object3D[],
    car: THREE.Group,
    scene: THREE.Scene,
    impactPoint: THREE.Vector3 | null = null
  ): void {
    cubes.forEach((cube) => {
      const worldPos = cube.getWorldPosition(new THREE.Vector3());
      const worldRot = cube.getWorldQuaternion(new THREE.Quaternion());

      car.remove(cube);
      scene.add(cube);

      cube.position.copy(worldPos);
      cube.quaternion.copy(worldRot);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * this.config.explosionForce,
        Math.random() * this.config.explosionUpward + 0.1,
        (Math.random() - 0.5) * this.config.explosionForce
      );

      if (impactPoint) {
        const dir = cube.position.clone().sub(impactPoint).normalize();
        velocity.copy(dir.multiplyScalar(this.config.explosionForce));
      }

      const userData = cube.userData as any;
      userData.velocity = velocity;
      userData.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * this.config.cubeRotationSpeed,
        (Math.random() - 0.5) * this.config.cubeRotationSpeed,
        (Math.random() - 0.5) * this.config.cubeRotationSpeed
      );
    });
  }

  public updateDestroyedCubes(
    cubes: THREE.Object3D[],
    scene: THREE.Scene,
    cameraTarget: THREE.Object3D
  ): void {
    cubes.forEach((cube) => {
      const userData = cube.userData as any;
      
      cube.position.add(userData.velocity);
      cube.rotation.x += userData.rotationSpeed.x;
      cube.rotation.y += userData.rotationSpeed.y;
      cube.rotation.z += userData.rotationSpeed.z;

      userData.velocity.y -= this.config.cubeGravity;

      if (cube.position.y < this.config.removalHeight) {
        scene.remove(cube);
      }
    });

    // Обновляем позицию камеры
    if (cubes.length > 0) {
      const center = new THREE.Vector3();
      cubes.forEach(cube => {
        center.add(cube.position);
      });
      center.divideScalar(cubes.length);
      cameraTarget.position.lerp(center, 0.1);
    }
  }

  public reset(): void {
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.targetPitch = 0;
  }

  public getState() {
    return {
      isJumping: this.isJumping,
      jumpVelocity: this.jumpVelocity,
      targetPitch: this.targetPitch
    };
  }
}