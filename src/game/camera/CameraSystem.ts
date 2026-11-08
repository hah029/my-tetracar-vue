import * as THREE from "three";
import { useCameraStore } from "@/store/cameraStore";
import { usePlayerStore } from "@/store/playerStore";

class CameraSystemClass {
  private camera: THREE.PerspectiveCamera | null = null;

  private basePosition = new THREE.Vector3();
  private targetPosition = new THREE.Vector3();
  private finalPosition = new THREE.Vector3();
  private lookAtPosition = new THREE.Vector3();

  private driveTimer = 0;
  private driveOffset = new THREE.Vector3();
  private eventOffset = new THREE.Vector3();
  private currentRoll = 0;

  private impactTimer = 0;
  private impactDuration = 0;
  private impactAmplitude = 0;
  private impactSeed = 0;

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

    this.basePosition.copy(this.camera.position);
    this.clearEventShake();
  }

  update(
    car: {
      position: THREE.Vector3;
      rotation: THREE.Euler;
      isDestroyed(): boolean;
    },
    speed: number,
    deltaTime = 1000 / 60,
  ) {
    if (!this.camera) return;
    if (car.isDestroyed()) return;

    const cameraStore = useCameraStore();
    const cfg = cameraStore.config;
    const playerStore = usePlayerStore();

    const carPos = car.position;
    const dt = Math.min(deltaTime, 50) / 1000;

    const rawSpeedFactor = speed / playerStore.maxSpeed;
    const speedFactor = THREE.MathUtils.clamp(rawSpeedFactor, 0, 1);
    const nitroBoost = playerStore.isNitroEnabled ? 0.06 : 0;

    const fovCurve = 1 - Math.pow(1 - speedFactor, 2);
    const distanceCurve = Math.pow(speedFactor, 0.6);

    this.targetPosition.set(
      carPos.x,
      cfg.settings.height - (cfg.settings.height * speedFactor - 1),
      carPos.z +
        cfg.settings.distance -
        cfg.settings.distance *
          distanceCurve *
          cfg.settings.distance_reduction_factor,
    );

    const followFactor = THREE.MathUtils.clamp(
      cfg.settings.follow_speed * Math.max(speedFactor, 0.08),
      0,
      1,
    );
    this.basePosition.lerp(this.targetPosition, followFactor);

    const driveMotionFactor =
      speed > 0 ? THREE.MathUtils.clamp(speedFactor, 0.28, 1) : 0;

    this.updateDriveMotion(driveMotionFactor, dt);
    this.updateEventShake(dt);

    this.finalPosition
      .copy(this.basePosition)
      .add(this.driveOffset)
      .add(this.eventOffset);
    this.camera.position.copy(this.finalPosition);

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

    this.lookAtPosition.set(
      carPos.x,
      carPos.y + cfg.settings.lookat_y_offset,
      carPos.z - cfg.settings.lookahead,
    );
    this.lookAtPosition.x +=
      this.driveOffset.x * cfg.shake.lookat + this.eventOffset.x * 0.22;
    this.lookAtPosition.y +=
      this.driveOffset.y * cfg.shake.lookat * 0.55 + this.eventOffset.y * 0.18;
    this.camera.lookAt(this.lookAtPosition);

    const targetTilt = -car.rotation.y * cfg.tilt.factor;
    this.currentRoll = THREE.MathUtils.lerp(
      this.currentRoll,
      targetTilt,
      THREE.MathUtils.clamp(cfg.settings.follow_speed * 0.35, 0, 1),
    );
    this.camera.rotation.z +=
      this.currentRoll + this.getDriveRoll(driveMotionFactor);
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

    this.clearEventShake();

    this.camera.position.lerp(targetCamPos, cfg.destroyed.lerp_factor);
    this.basePosition.copy(this.camera.position);

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

    this.driveTimer = 0;
    this.driveOffset.set(0, 0, 0);
    this.currentRoll = 0;
    this.clearEventShake();

    this.camera.position.set(
      carPosition.x,
      cfg.settings.height,
      carPosition.z + cfg.settings.distance,
    );
    this.basePosition.copy(this.camera.position);

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

  private updateDriveMotion(speedFactor: number, deltaSeconds: number) {
    const cfg = useCameraStore().config.shake;

    const amplitude =
      cfg.base.amplitude +
      (cfg.max.amplitude - cfg.base.amplitude) * speedFactor;

    const frequency =
      cfg.base.frequency +
      (cfg.max.frequency - cfg.base.frequency) * speedFactor;

    this.driveTimer += deltaSeconds * frequency * Math.PI * 2;
    this.driveOffset.set(
      Math.sin(this.driveTimer * 0.72) * amplitude * 0.65,
      Math.sin(this.driveTimer) * amplitude * cfg.multiplier.y,
      Math.cos(this.driveTimer * 0.47) * amplitude * cfg.multiplier.z,
    );
  }

  private updateEventShake(deltaSeconds: number) {
    this.eventOffset.set(0, 0, 0);
    if (this.impactTimer >= this.impactDuration || this.impactDuration <= 0) {
      return;
    }

    this.impactTimer += deltaSeconds;
    const progress = THREE.MathUtils.clamp(
      this.impactTimer / this.impactDuration,
      0,
      1,
    );
    const cfg = useCameraStore().config.impact_shake;
    const decay = Math.exp(-cfg.decay_rate * progress);
    const amplitude = this.impactAmplitude * decay;
    const t = this.impactTimer * 60;

    this.eventOffset.set(
      Math.sin(t * 2.17 + this.impactSeed) * amplitude * 0.8,
      Math.sin(t * 2.83 + this.impactSeed * 1.7) * amplitude * 0.5,
      Math.sin(t * 1.63 + this.impactSeed * 2.3) * amplitude * 0.35,
    );
  }

  private getDriveRoll(speedFactor: number) {
    const cfg = useCameraStore().config.shake;
    const roll =
      Math.sin(this.driveTimer * 0.58) *
      cfg.roll *
      THREE.MathUtils.clamp(speedFactor, 0, 1);
    const eventRoll =
      this.eventOffset.x *
      0.01 *
      THREE.MathUtils.clamp(this.impactAmplitude / 0.34, 0, 1);
    return roll + eventRoll;
  }

  private clearEventShake() {
    this.impactTimer = 0;
    this.impactDuration = 0;
    this.impactAmplitude = 0;
    this.impactSeed = 0;
    this.eventOffset.set(0, 0, 0);
  }

  public triggerImpactShake(
    strength: number,
    duration = useCameraStore().config.impact_shake.duration,
  ) {
    const cameraStore = useCameraStore();
    const cfg = cameraStore.config;
    const normalizedStrength = THREE.MathUtils.clamp(strength, 0, 1);
    const durationSeconds = duration > 10 ? duration / 1000 : duration;

    this.impactTimer = 0;
    this.impactDuration = Math.max(0.05, durationSeconds);
    this.impactSeed = Math.random() * Math.PI * 2;

    this.impactAmplitude = THREE.MathUtils.lerp(
      cfg.impact_shake.min,
      cfg.impact_shake.max,
      normalizedStrength,
    );
  }

  public triggerShotShake() {
    const cfg = useCameraStore().config.event_shake.shot;
    this.triggerImpactShake(cfg.strength, cfg.duration);
  }

  public triggerNitroShake(corrupted = false) {
    const cfg = useCameraStore().config.event_shake;
    const shake = corrupted ? cfg.heavy_nitro : cfg.nitro;
    this.triggerImpactShake(shake.strength, shake.duration);
  }

  public triggerPickupRejectedShake() {
    const shake = useCameraStore().config.event_shake.pickup_rejected;

    this.impactTimer = 0;
    this.impactDuration = shake.duration;
    this.impactAmplitude = shake.amplitude;
    this.impactSeed = Math.random() * Math.PI * 2;
  }

  public triggerLandingShake() {
    const cfg = useCameraStore().config.event_shake.landing;
    this.triggerImpactShake(cfg.strength, cfg.duration);
  }

  getCamera() {
    return this.camera;
  }
}

export const CameraSystem = new CameraSystemClass();
