import * as THREE from "three";
import { useGameState } from "@/store/gameState";

/**
 * CameraSystem — отвечает ТОЛЬКО за поведение камеры
 * Никакой логики игры, Vue или менеджеров
 */

const CAMERA_HEIGHT = 5;
const CAMERA_DISTANCE = 8;
const CAMERA_LOOKAHEAD = 10;
const CAMERA_FOLLOW_SPEED = 0.15;

const FOV_MIN = 60;
const FOV_MAX = 80;

const SHAKE_BASE_AMPLITUDE = 0.000001; // минимальная
const SHAKE_MAX_AMPLITUDE = 0.01; // на максимальной скорости
const SHAKE_BASE_FREQUENCY = 1;
const SHAKE_MAX_FREQUENCY = 10;

class CameraSystemClass {
  private camera: THREE.PerspectiveCamera | null = null;
  private shakeTime = 0;
  private shakeOffset = new THREE.Vector3();

  initialize(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(
    car: {
      position: THREE.Vector3;
      rotation: THREE.Euler;
      isDestroyed(): boolean;
    },
    speed: number,
  ) {
    if (!this.camera) return;
    if (car.isDestroyed()) return;

    const MAX_SPEED = useGameState().maxSpeed;

    const carPos = car.position;
    const speedFactor = speed / MAX_SPEED;
    const speedFactorNorm = Math.min(speedFactor, 1);

    // 1. Позиция камеры
    const targetCamPos = new THREE.Vector3(
      carPos.x,
      CAMERA_HEIGHT - (CAMERA_HEIGHT * speedFactor - 1),
      // carPos.z + (CAMERA_DISTANCE - (CAMERA_DISTANCE * speed) / MAX_SPEED),
      carPos.z + CAMERA_DISTANCE - CAMERA_DISTANCE * speedFactor * 0.8,
    );

    this.camera.position.lerp(targetCamPos, CAMERA_FOLLOW_SPEED * speedFactor);
    this.applyShake(speedFactorNorm);
    this.camera.position.add(this.shakeOffset);

    // 2. Наклон при поворотах
    const targetTilt = -car.rotation.y * 0.3;
    this.camera.rotation.z +=
      (targetTilt - this.camera.rotation.z) * CAMERA_FOLLOW_SPEED;

    // 3. Динамический FOV
    const targetFOV = FOV_MIN + (FOV_MAX - FOV_MIN) * speedFactorNorm;

    this.camera.fov = THREE.MathUtils.clamp(
      this.camera.fov + (targetFOV - this.camera.fov) * CAMERA_FOLLOW_SPEED,
      10,
      170,
    );
    this.camera.updateProjectionMatrix();

    // 4. LookAt
    const lookAtPos = new THREE.Vector3(
      carPos.x,
      carPos.y + 1,
      carPos.z - CAMERA_LOOKAHEAD,
    );
    this.camera.lookAt(lookAtPos);
  }

  updateDestroyed(cubes: THREE.Object3D[]) {
    if (!this.camera) return;
    if (cubes.length === 0) return;

    const center = new THREE.Vector3();
    cubes.forEach((cube) => center.add(cube.position));
    center.divideScalar(cubes.length);

    const targetCamPos = center.clone().add(new THREE.Vector3(0, 3, 8));
    this.camera.position.lerp(targetCamPos, 0.05);
    this.shakeOffset.multiplyScalar(0.9);
    this.camera.position.add(this.shakeOffset);
    this.camera.lookAt(center);
  }

  reset(carPosition: THREE.Vector3) {
    if (!this.camera) return;
    this.shakeTime = 0;
    this.shakeOffset.set(0, 0, 0);

    this.camera.position.set(
      carPosition.x,
      CAMERA_HEIGHT,
      carPosition.z + CAMERA_DISTANCE,
    );

    this.camera.fov = FOV_MIN;
    this.camera.rotation.z = 0;
    this.camera.updateProjectionMatrix();

    this.camera.lookAt(
      carPosition.x,
      carPosition.y + 1,
      carPosition.z - CAMERA_LOOKAHEAD,
    );
  }

  private applyShake(speedFactor: number, deltaTime = 1) {
    this.shakeTime += deltaTime;

    const amplitude =
      SHAKE_BASE_AMPLITUDE +
      (SHAKE_MAX_AMPLITUDE - SHAKE_BASE_AMPLITUDE) * speedFactor;

    const frequency =
      SHAKE_BASE_FREQUENCY +
      (SHAKE_MAX_FREQUENCY - SHAKE_BASE_FREQUENCY) * speedFactor;

    this.shakeOffset
      .set(
        Math.sin(this.shakeTime * frequency),
        Math.sin(this.shakeTime * frequency * 1.3),
        Math.cos(this.shakeTime * frequency * 0.7),
      )
      .multiplyScalar(amplitude);
  }
}

export const CameraSystem = new CameraSystemClass();
