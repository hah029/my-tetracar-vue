import * as THREE from "three";

/**
 * CameraSystem — отвечает ТОЛЬКО за поведение камеры
 * Никакой логики игры, Vue или менеджеров
 */

const CAMERA_HEIGHT = 4;
const CAMERA_DISTANCE = 8;
const CAMERA_LOOKAHEAD = 10;
const CAMERA_FOLLOW_SPEED = 0.08;

const FOV_MIN = 55;
const FOV_MAX = 120;
const SPEED_FOR_MAX_FOV = 3;

class CameraSystemClass {
  private camera: THREE.PerspectiveCamera | null = null;

  initialize(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(car: {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    isDestroyed(): boolean;
  }, speed: number) {
    if (!this.camera) return;
    if (car.isDestroyed()) return;

    const carPos = car.position;

    // 1. Позиция камеры
    const targetCamPos = new THREE.Vector3(
      carPos.x,
      CAMERA_HEIGHT,
      carPos.z + CAMERA_DISTANCE
    );

    this.camera.position.lerp(targetCamPos, CAMERA_FOLLOW_SPEED);

    // 2. Наклон при поворотах
    const targetTilt = -car.rotation.y * 0.5;
    this.camera.rotation.z +=
      (targetTilt - this.camera.rotation.z) * CAMERA_FOLLOW_SPEED;

    // 3. Динамический FOV
    const speedFactor = Math.min(speed / SPEED_FOR_MAX_FOV, 1);
    const targetFOV = FOV_MIN + (FOV_MAX - FOV_MIN) * speedFactor;

    this.camera.fov = THREE.MathUtils.clamp(
      this.camera.fov +
        (targetFOV - this.camera.fov) * CAMERA_FOLLOW_SPEED,
      10,
      170
    );
    this.camera.updateProjectionMatrix();

    // 4. LookAt
    const lookAtPos = new THREE.Vector3(
      carPos.x,
      carPos.y + 1,
      carPos.z - CAMERA_LOOKAHEAD
    );
    this.camera.lookAt(lookAtPos);
  }

  updateDestroyed(cubes: THREE.Object3D[]) {
    if (!this.camera) return;
    if (cubes.length === 0) return;

    const center = new THREE.Vector3();
    cubes.forEach(cube => center.add(cube.position));
    center.divideScalar(cubes.length);

    const targetCamPos = center.clone().add(new THREE.Vector3(0, 3, -8));
    this.camera.position.lerp(targetCamPos, 0.05);
    this.camera.lookAt(center);
  }

  reset(carPosition: THREE.Vector3) {
    if (!this.camera) return;

    this.camera.position.set(
      carPosition.x,
      CAMERA_HEIGHT,
      carPosition.z + CAMERA_DISTANCE
    );

    this.camera.fov = FOV_MIN;
    this.camera.rotation.z = 0;
    this.camera.updateProjectionMatrix();

    this.camera.lookAt(
      carPosition.x,
      carPosition.y + 1,
      carPosition.z - CAMERA_LOOKAHEAD
    );
  }
}

export const CameraSystem = new CameraSystemClass();