import * as THREE from "three";
import { useCameraStore } from "@/store/cameraStore";
import { usePlayerStore } from "@/store/playerStore";

class CameraSystemClass {
  /**
   * CameraSystem — отвечает ТОЛЬКО за поведение камеры
   * Никакой логики игры, Vue или менеджеров
   */
  private camera: THREE.PerspectiveCamera | null = null;

  // base shake
  private shakeTimer = 0;
  private shakeOffset = new THREE.Vector3();

  // impact shake
  private impactTimer = 0;
  private impactDuration = 50000;
  private impactAmplitude = 10000;
  private impactOffset = new THREE.Vector3();

  initialize(camera: THREE.PerspectiveCamera) {
    const cameraStore = useCameraStore();

    this.camera = camera;
    this.camera.position.set(
      cameraStore.CAMERA_INIT_POSITION_X,
      cameraStore.CAMERA_INIT_POSITION_Y,
      cameraStore.CAMERA_INIT_POSITION_Z,
    );
    this.camera.lookAt(
      cameraStore.CAMERA_INIT_LOOKAT_X,
      cameraStore.CAMERA_INIT_LOOKAT_Y,
      cameraStore.CAMERA_INIT_LOOKAT_Z,
    );
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

    const MAX_SPEED = usePlayerStore().maxSpeed;

    const carPos = car.position;
    const speedFactor = speed / MAX_SPEED;
    const speedFactorNorm = Math.min(speedFactor, 1);

    // 1. Позиция камеры
    const cameraStore = useCameraStore();
    const targetCamPos = new THREE.Vector3(
      carPos.x,
      cameraStore.CAMERA_HEIGHT - (cameraStore.CAMERA_HEIGHT * speedFactor - 1),
      carPos.z +
        cameraStore.CAMERA_DISTANCE -
        cameraStore.CAMERA_DISTANCE *
          speedFactor *
          cameraStore.DISTANCE_REDUCTION_FACTOR,
    );

    this.camera.position.lerp(
      targetCamPos,
      cameraStore.CAMERA_FOLLOW_SPEED * speedFactor,
    );
    this.applyShake(speedFactorNorm);
    this.camera.position.add(this.shakeOffset);

    // 2. Наклон при поворотах
    const targetTilt = -car.rotation.y * cameraStore.TILT_FACTOR;
    this.camera.rotation.z +=
      (targetTilt - this.camera.rotation.z) * cameraStore.CAMERA_FOLLOW_SPEED;

    // 3. Динамический FOV с плавным изменением
    const targetFOV =
      cameraStore.FOV_MIN +
      (cameraStore.FOV_MAX - cameraStore.FOV_MIN) * speedFactorNorm;
    this.camera.fov = THREE.MathUtils.clamp(
      this.camera.fov +
        (targetFOV - this.camera.fov) * cameraStore.FOV_FOLLOW_SPEED,
      cameraStore.FOV_CLAMP_MIN,
      cameraStore.FOV_CLAMP_MAX,
    );
    this.camera.updateProjectionMatrix();

    // 4. LookAt
    const lookAtPos = new THREE.Vector3(
      carPos.x,
      carPos.y + cameraStore.LOOKAT_Y_OFFSET,
      carPos.z - cameraStore.CAMERA_LOOKAHEAD,
    );
    this.camera.lookAt(lookAtPos);
  }

  updateDestroyed(cubes: THREE.Object3D[], deltaTime: number) {
    if (!this.camera) return;
    if (cubes.length === 0) return;

    const cameraStore = useCameraStore();
    const center = new THREE.Vector3();
    cubes.forEach((cube) => center.add(cube.position));
    center.divideScalar(cubes.length);

    const targetCamPos = center
      .clone()
      .add(
        new THREE.Vector3(
          cameraStore.DESTROYED_CAMERA_OFFSET_X,
          cameraStore.DESTROYED_CAMERA_OFFSET_Y,
          cameraStore.DESTROYED_CAMERA_OFFSET_Z,
        ),
      );
    this.camera.position.lerp(targetCamPos, cameraStore.DESTROYED_LERP_FACTOR);

    this.applyImpactShake(deltaTime);
    this.camera.position.add(this.impactOffset);

    this.camera.lookAt(center);
  }

  reset(carPosition: THREE.Vector3) {
    if (!this.camera) {
      console.warn("[CameraSystem.reset] camera is null");
      return;
    }
    this.shakeTimer = 0;
    this.shakeOffset.set(0, 0, 0);

    const cameraStore = useCameraStore();

    this.camera.position.set(
      carPosition.x,
      cameraStore.CAMERA_HEIGHT,
      carPosition.z + cameraStore.CAMERA_DISTANCE,
    );

    this.camera.fov = cameraStore.FOV_MIN;
    this.camera.rotation.z = 0;
    this.camera.updateProjectionMatrix();

    const lookAt = new THREE.Vector3(
      carPosition.x,
      carPosition.y + cameraStore.LOOKAT_Y_OFFSET,
      carPosition.z - cameraStore.CAMERA_LOOKAHEAD,
    );
    this.camera.lookAt(lookAt);
  }

  private applyShake(speedFactor: number, deltaTime = 1) {
    this.shakeTimer += deltaTime;
    const cameraStore = useCameraStore();

    const amplitude =
      cameraStore.SHAKE_BASE_AMPLITUDE +
      (cameraStore.SHAKE_MAX_AMPLITUDE - cameraStore.SHAKE_BASE_AMPLITUDE) *
        speedFactor;

    const frequency =
      cameraStore.SHAKE_BASE_FREQUENCY +
      (cameraStore.SHAKE_MAX_FREQUENCY - cameraStore.SHAKE_BASE_FREQUENCY) *
        speedFactor;

    this.shakeOffset
      .set(
        Math.sin(this.shakeTimer * frequency),
        Math.sin(
          this.shakeTimer *
            frequency *
            cameraStore.SHAKE_FREQUENCY_MULTIPLIER_Y,
        ),
        Math.cos(
          this.shakeTimer *
            frequency *
            cameraStore.SHAKE_FREQUENCY_MULTIPLIER_Z,
        ),
      )
      .multiplyScalar(amplitude);
  }

  public triggerImpactShake(
    strength: number, // 0..1
    duration = 0.4,
  ) {
    this.impactTimer = 0;
    this.impactDuration = duration;
    const cameraStore = useCameraStore();

    this.impactAmplitude = THREE.MathUtils.lerp(
      cameraStore.IMPACT_SHAKE_MIN,
      cameraStore.IMPACT_SHAKE_MAX,
      strength,
    );
  }

  private applyImpactShake(deltaTime: number) {
    if (this.impactTimer >= this.impactDuration) {
      this.impactOffset.set(0, 0, 0);
      return;
    }

    const cameraStore = useCameraStore();
    this.impactTimer += deltaTime;
    const t = this.impactTimer / this.impactDuration;

    // easing: резкий старт → плавное затухание
    const decay = Math.exp(-cameraStore.IMPACT_SHAKE_DECAY_RATE * t);

    this.impactOffset
      .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      .multiplyScalar(this.impactAmplitude * decay);
  }
}

export const CameraSystem = new CameraSystemClass();
