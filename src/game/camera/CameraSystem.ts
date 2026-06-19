import * as THREE from "three";
import { useCameraStore } from "@/store/cameraStore";
import { usePlayerStore } from "@/store/playerStore";

class CameraSystemClass {
  private camera: THREE.PerspectiveCamera | null = null;

  // base shake
  private shakeTimer = 0;
  private shakeOffset = new THREE.Vector3();

  // impact shake
  private impactTimer = 0;
  private impactOffset = new THREE.Vector3();
  private impactDuration!: number;
  private impactAmplitude!: number;

  initialize(camera: THREE.PerspectiveCamera) {
    const cameraStore = useCameraStore();
    const cfg = cameraStore.config;

    this.camera = camera;

    this.camera.position.set(
      cfg.inits.position.x,
      cfg.inits.position.y,
      cfg.inits.position.z,
    );
    this.camera.lookAt(
      cfg.inits.lookat.x,
      cfg.inits.lookat.y,
      cfg.inits.lookat.z,
    );

    this.impactDuration = cfg.impact_shake.duration;
    this.impactAmplitude = cfg.impact_shake.max_amplitude;
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

    const cameraStore = useCameraStore();
    const cfg = cameraStore.config;

    const carPos = car.position;

    const rawSpeedFactor = speed / usePlayerStore().maxSpeed;
    const speedFactor = THREE.MathUtils.clamp(rawSpeedFactor, 0, 1);
    const nitroBoost = usePlayerStore().isNitroEnabled ? 0.06 : 0;
    const speedFactorNorm = speedFactor;

    const fovCurve = 1 - Math.pow(1 - speedFactor, 2);
    const distanceCurve = Math.pow(speedFactor, 0.6);

    // 1. Позиция камеры
    const targetCamPos = new THREE.Vector3(
      carPos.x,
      cfg.settings.height - (cfg.settings.height * speedFactor - 1),
      carPos.z +
        cfg.settings.distance -
        cfg.settings.distance *
          distanceCurve *
          cfg.settings.distance_reduction_factor,
    );

    this.camera.position.lerp(
      targetCamPos,
      cfg.settings.follow_speed * speedFactor,
    );
    this.applyShake(speedFactorNorm);
    this.camera.position.add(this.shakeOffset);

    // 2. Наклон при поворотах
    const targetTilt = -car.rotation.y * cfg.tilt.factor;
    this.camera.rotation.z +=
      (targetTilt - this.camera.rotation.z) * cfg.settings.follow_speed;

    // 3. Динамический FOV с плавным изменением
    const targetFOV =
      cfg.fov.min +
      (cfg.fov.max - cfg.fov.min) * fovCurve +
      cfg.fov.max * nitroBoost;
    this.camera.fov = THREE.MathUtils.clamp(
      this.camera.fov + (targetFOV - this.camera.fov) * cfg.fov.follow_speed,
      cfg.fov.clamp.min,
      cfg.fov.clamp.max,
    );
    this.camera.updateProjectionMatrix();

    // 4. LookAt
    const lookAtPos = new THREE.Vector3(
      carPos.x,
      carPos.y + cfg.settings.lookat_y_offset,
      carPos.z - cfg.settings.lookahead,
    );
    this.camera.lookAt(lookAtPos);
  }

  updateDestroyed(
    cubes: THREE.Object3D[],
    deltaTime: number,
    fallbackPosition?: THREE.Vector3,
  ) {
    if (!this.camera) return;

    const cameraStore = useCameraStore();
    const cfg = cameraStore.config;

    let targetCamPos: THREE.Vector3;

    const isValidVector = (v: THREE.Vector3) =>
      !isNaN(v.x) &&
      !isNaN(v.y) &&
      !isNaN(v.z) &&
      isFinite(v.x) &&
      isFinite(v.y) &&
      isFinite(v.z);

    if (cubes.length > 0) {
      const center = new THREE.Vector3();
      let validCount = 0;
      cubes.forEach((cube) => {
        if (isValidVector(cube.position)) {
          center.add(cube.position);
          validCount++;
        }
      });
      if (validCount > 0) {
        center.divideScalar(validCount);
        targetCamPos = center
          .clone()
          .add(
            new THREE.Vector3(
              cfg.destroyed.offset.x,
              cfg.destroyed.offset.y,
              cfg.destroyed.offset.z,
            ),
          );
      } else {
        targetCamPos = this.getSafeFallbackPosition(fallbackPosition, cfg);
      }
    } else {
      targetCamPos = this.getSafeFallbackPosition(fallbackPosition, cfg);
    }

    if (!isValidVector(targetCamPos)) {
      targetCamPos = new THREE.Vector3(
        0,
        cfg.destroyed.offset.y,
        cfg.destroyed.offset.z,
      );
    }

    this.impactAmplitude = 0;
    this.impactOffset.set(0, 0, 0);

    this.camera.position.lerp(targetCamPos, cfg.destroyed.lerp_factor);

    this.camera.rotation.z = 0;
    this.camera.rotation.x = 0;
    this.camera.fov = cfg.fov.min;
    this.camera.updateProjectionMatrix();

    const lookAtPos = new THREE.Vector3(
      targetCamPos.x,
      targetCamPos.y - 1,
      targetCamPos.z - cfg.settings.lookahead,
    );
    this.camera.lookAt(lookAtPos);
  }

  private getSafeFallbackPosition(
    fallbackPosition: THREE.Vector3 | undefined,
    cfg: ReturnType<typeof useCameraStore>["config"],
  ): THREE.Vector3 {
    const isValidVector = (v: THREE.Vector3) =>
      !isNaN(v.x) &&
      !isNaN(v.y) &&
      !isNaN(v.z) &&
      isFinite(v.x) &&
      isFinite(v.y) &&
      isFinite(v.z);
    if (fallbackPosition && isValidVector(fallbackPosition)) {
      return fallbackPosition.clone();
    }
    return new THREE.Vector3(0, cfg.destroyed.offset.y, cfg.destroyed.offset.z);
  }

  reset(carPosition: THREE.Vector3) {
    if (!this.camera) {
      console.warn("[CameraSystem.reset] camera is null");
      return;
    }

    const cameraStore = useCameraStore();
    const cfg = cameraStore.config;

    this.shakeTimer = 0;
    this.shakeOffset.set(0, 0, 0);

    this.camera.position.set(
      carPosition.x,
      cfg.settings.height,
      carPosition.z + cfg.settings.distance,
    );

    this.camera.fov = cfg.fov.min;
    this.camera.rotation.z = 0;
    this.camera.updateProjectionMatrix();

    const lookAt = new THREE.Vector3(
      carPosition.x,
      carPosition.y + cfg.settings.lookat_y_offset,
      carPosition.z - cfg.settings.lookahead,
    );
    this.camera.lookAt(lookAt);
  }

  private applyShake(speedFactor: number, deltaTime = 1) {
    this.shakeTimer += deltaTime;

    const cfg = useCameraStore().config.shake;

    const amplitude =
      cfg.base.amplitude +
      (cfg.max.amplitude - cfg.base.amplitude) * speedFactor;

    const frequency =
      cfg.base.frequency +
      (cfg.max.frequency - cfg.base.frequency) * speedFactor;

    this.shakeOffset
      .set(
        Math.sin(this.shakeTimer * frequency),
        Math.sin(this.shakeTimer * frequency * cfg.multiplier.y),
        Math.cos(this.shakeTimer * frequency * cfg.multiplier.z),
      )
      .multiplyScalar(amplitude);
  }

  public triggerImpactShake(
    strength: number, // 0..1
    duration = 0.4,
  ) {
    const cameraStore = useCameraStore();
    const cfg = cameraStore.config;

    this.impactTimer = 0;
    this.impactDuration = duration;

    this.impactAmplitude = THREE.MathUtils.lerp(
      cfg.impact_shake.min,
      cfg.impact_shake.max,
      strength,
    );
  }

  // private applyImpactShake(deltaTime: number) {
  //   if (this.impactTimer >= this.impactDuration) {
  //     this.impactOffset.set(0, 0, 0);
  //     return;
  //   }
  //
  //   this.impactTimer += deltaTime;
  //   const t = this.impactTimer / this.impactDuration;
  //
  //   const cameraStore = useCameraStore();
  //   const cfg = cameraStore.config.value;
  //   const decay = Math.exp(-cfg.impact_shake.decay_rate * t);
  //
  //   this.impactOffset
  //     .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
  //     .multiplyScalar(this.impactAmplitude * decay);
  // }

  getCamera() {
    return this.camera;
  }
}

export const CameraSystem = new CameraSystemClass();
