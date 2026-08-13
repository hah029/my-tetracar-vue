import * as THREE from "three";
import { cameraTarget } from "@/game/camera/cameraTarget.js";
import { RoadManager } from "@/game/environment/road";
import { type CarState, type CarConfig } from "./types";
import { CarCollider } from "./CarCollider";
import { CarCubesBuilder } from "./CarCubesBuilder";
import { useGameState } from "@/store/gameState.js";
import { CarVisualState, type CarVisualEffect } from "./CarVisualState";
import { usePlayerStore } from "@/store/playerStore.js";
import { CarPhysics } from "./CarPhysics.js";
import { FlashEffectManager } from "../effects/FlashEffectManager.js";
import { useCommonStore } from "@/store/commonStore.js";
import { CameraSystem } from "@/game/camera/CameraSystem.js";

export class Car extends THREE.Group {
  private static readonly LANE_HEIGHT_BLOCK_EPSILON = 0.35;
  private static readonly EDGE_FALLOFF_MIN_HEIGHT = 0.5;
  private static readonly OFF_ROAD_SIDE_SPEED = 0.018;
  private static readonly OFF_ROAD_FALL_GRAVITY = 0.000045;
  private static readonly OFF_ROAD_FORWARD_SPEED = 0.006;
  private static readonly OFF_ROAD_GAMEOVER_DELAY = 900;
  private static readonly EDGE_BUMP_DISTANCE = 0.55;
  private static readonly EDGE_BUMP_DURATION = 180;
  private scene: THREE.Scene;
  private state: CarState;
  private collider: CarCollider;
  private builder: CarCubesBuilder;
  private physics: CarPhysics;
  private config: Required<CarConfig>;

  private currentLane: number;
  private cubes: THREE.Object3D[] = [];
  private visualState: CarVisualState | null = null;
  private offRoadVelocity: THREE.Vector3 | null = null;
  private offRoadGameOverTimer = 0;
  private gameOverCameraPosition: THREE.Vector3 | null = null;
  private edgeBumpDirection: -1 | 1 | null = null;
  private edgeBumpTimer = 0;

  constructor(scene: THREE.Scene, config: Partial<CarConfig> = {}) {
    super();
    this.scene = scene;

    this.config = {
      ...usePlayerStore().getDefaultCarConfig(),
      ...config,
    };
    this.currentLane = this.config.startLane;

    this.state = {
      isJumping: false,
      jumpVelocity: 0,
      targetPitch: 0,
      isDestroyed: false,
      cubes: [],
    };

    this.collider = new CarCollider({
      shrinkX: this.config.colliderShrinkX,
      shrinkZ: this.config.colliderShrinkZ,
      yOffset: this.config.colliderYOffset,
      heightFactor: this.config.colliderHeightFactor,
    });

    this.builder = new CarCubesBuilder();
    this.physics = new CarPhysics(this.config);

    this.position.copy(this.config.startPosition);
    this.castShadow = true;
    this.scene = scene;
    this.scene.add(this);

    cameraTarget.position.set(0, 0, -10);
    this.add(cameraTarget);
  }

  // Управление полосами
  public getCurrentLane(): number {
    return this.currentLane;
  }

  public setCurrentLane(lane: number): void {
    const roadManager = RoadManager.getInstance();
    const maxLane = roadManager.getLanesCount() - 1;
    this.currentLane = Math.max(0, Math.min(lane, maxLane));
  }

  public moveLeft(): void {
    this.tryMoveToLane(this.currentLane - 1);
  }

  public moveRight(): void {
    this.tryMoveToLane(this.currentLane + 1);
  }

  private tryMoveToLane(targetLane: number): void {
    if (this.state.isDestroyed || this.offRoadVelocity) return;

    const roadManager = RoadManager.getInstance();
    const maxLane = roadManager.getLanesCount() - 1;

    if (targetLane < 0 || targetLane > maxLane) {
      this.handleOutOfRoadMove(targetLane < 0 ? -1 : 1);
      return;
    }

    if (!this.canMoveToLane(targetLane)) return;

    this.currentLane = targetLane;
  }

  private canMoveToLane(targetLane: number): boolean {
    const roadManager = RoadManager.getInstance();
    const targetY =
      useCommonStore().baseItemYpos +
      roadManager.getSurfaceHeightAt(targetLane, this.position.z);

    return this.position.y >= targetY - Car.LANE_HEIGHT_BLOCK_EPSILON;
  }

  private handleOutOfRoadMove(direction: -1 | 1): void {
    const currentHeight = RoadManager.getInstance().getSurfaceHeightAt(
      this.currentLane,
      this.position.z,
    );

    if (
      currentHeight <= Car.EDGE_FALLOFF_MIN_HEIGHT &&
      !this.state.isJumping
    ) {
      this.startEdgeBump(direction);
      return;
    }

    this.startOffRoadFall(direction);
  }

  private startOffRoadFall(direction: -1 | 1): void {
    if (this.state.isDestroyed || this.offRoadVelocity) return;

    const roadManager = RoadManager.getInstance();
    this.gameOverCameraPosition = this.position.clone();
    this.gameOverCameraPosition.y =
      useCommonStore().baseItemYpos +
      roadManager.getSurfaceHeightAt(this.currentLane, this.position.z);

    this.remove(cameraTarget);
    this.scene.add(cameraTarget);
    cameraTarget.position.copy(this.gameOverCameraPosition);

    this.offRoadVelocity = new THREE.Vector3(
      direction * Car.OFF_ROAD_SIDE_SPEED,
      0.002,
      -Car.OFF_ROAD_FORWARD_SPEED,
    );
    this.offRoadGameOverTimer = Car.OFF_ROAD_GAMEOVER_DELAY;
    this.rotation.z -= direction * 0.25;
    this.collider.disableDebug(this.scene);
  }

  private startEdgeBump(direction: -1 | 1): void {
    this.edgeBumpDirection = direction;
    this.edgeBumpTimer = Car.EDGE_BUMP_DURATION;
    CameraSystem.triggerImpactShake(0.28, 0.16);
  }

  // Прыжок
  public jump(): void {
    if (
      !this.state.isDestroyed &&
      !this.state.isJumping &&
      !this.offRoadVelocity
    ) {
      this.physics.startJump(this.position.y);
    }
  }

  public startShieldCooldown(duration: number) {
    this.visualState?.startBlink(duration);
  }

  // Обновление
  public update(dt: number): void {
    if (this.offRoadVelocity) {
      this.updateOffRoadFall(dt);
      return;
    }

    if (this.state.isDestroyed) {
      this.physics.updateDestroyedCubes(this.cubes, this.scene, dt);
      return;
    }

    this.visualState?.update(dt);
    this.updateEdgeBump(dt);

    const roadManager = RoadManager.getInstance();
    const lanes = roadManager.getLanes();
    const groundY =
      useCommonStore().baseItemYpos +
      roadManager.getSurfaceHeightAt(this.currentLane, this.position.z);

    // Обновляем позицию по полосам
    const clampedLane = Math.min(
      Math.max(this.currentLane, 0),
      lanes.length - 1,
    );
    const targetX = (lanes[clampedLane] || 0) + this.getEdgeBumpOffset();

    const { newX, newRotationY } = this.physics.updateLaneMovement(
      this.position.x,
      targetX,
      this.rotation.y,
      dt,
    );

    this.position.x = newX;
    this.rotation.y = newRotationY;

    // Обновляем прыжок
    const jumpResult = this.physics.updateJump(this.position.y, dt, groundY);

    if (jumpResult.hasLanded)
      FlashEffectManager.getInstance().spawnLandingWave(this.position);

    this.position.y = jumpResult.newY;
    this.state.isJumping = jumpResult.isJumping;
    this.rotation.x += (jumpResult.pitch - this.rotation.x) * 0.035;

    // Обновляем коллайдер
    if (this.cubes.length > 0) {
      this.updateWorldMatrix(true, true);
      this.collider.updateFromCubes(this.cubes);
    }

    if (useGameState().isDebug && !this.collider.debugMesh) {
      this.collider.enableDebug(this.scene);
    } else if (!useGameState().isDebug && this.collider.debugMesh) {
      this.collider.disableDebug(this.scene);
    }
  }

  private updateOffRoadFall(dt: number): void {
    if (!this.offRoadVelocity) return;

    this.offRoadVelocity.y -= Car.OFF_ROAD_FALL_GRAVITY * dt;
    this.position.x += this.offRoadVelocity.x * dt;
    this.position.y += this.offRoadVelocity.y * dt;
    this.position.z += this.offRoadVelocity.z * dt;

    this.rotation.x += 0.0012 * dt;
    this.rotation.z -= Math.sign(this.offRoadVelocity.x) * 0.0016 * dt;

    this.offRoadGameOverTimer -= dt;
    if (this.offRoadGameOverTimer <= 0 && !this.state.isDestroyed) {
      this.state.isDestroyed = true;
      useGameState().endGame();
    }
  }

  private updateEdgeBump(dt: number): void {
    if (!this.edgeBumpDirection) return;

    this.edgeBumpTimer = Math.max(0, this.edgeBumpTimer - dt);
    if (this.edgeBumpTimer <= 0) {
      this.edgeBumpDirection = null;
    }
  }

  private getEdgeBumpOffset(): number {
    if (!this.edgeBumpDirection) return 0;

    const progress = 1 - this.edgeBumpTimer / Car.EDGE_BUMP_DURATION;
    return (
      this.edgeBumpDirection *
      Math.sin(progress * Math.PI) *
      Car.EDGE_BUMP_DISTANCE
    );
  }

  // Коллизии
  public checkObstacleCollision(obstacle: THREE.Object3D): boolean {
    if (this.state.isDestroyed || this.offRoadVelocity) return false;
    return this.collider.checkObstacleCollision(obstacle);
  }

  public checkJumpCollision(jump: THREE.Object3D): boolean {
    if (this.state.isDestroyed || this.offRoadVelocity) return false;
    return this.collider.checkJumpCollision(jump, this.position);
  }

  public getCollider(): THREE.Box3 {
    return this.collider.getCollider();
  }

  // Построение машины
  public async build(useGLB: boolean = true): Promise<void> {
    // Очищаем текущую машину
    this.clearCubes();

    // Строим новые кубики
    this.cubes = await this.builder.buildFromCubes(useGLB, (cube) => {
      this.add(cube);
    });

    this.state.cubes = this.cubes;
    this.visualState = new CarVisualState(this.cubes);

    this.applyVisualConfig();

    // Добавляем камеру обратно
    this.add(cameraTarget);

    // Обновляем коллайдер
    if (this.cubes.length > 0) {
      this.collider.updateFromCubes(this.cubes);
    }
  }

  // Разрушение
  public destroy(impactPoint: THREE.Vector3 | null = null): void {
    if (this.state.isDestroyed) return;

    this.state.isDestroyed = true;

    // Отключаем камеру
    this.remove(cameraTarget);
    this.scene.add(cameraTarget);

    // Разбрасываем кубики
    this.physics.createExplosionCubes(
      this.cubes,
      this,
      this.scene,
      impactPoint,
    );

    this.collider.disableDebug(this.scene);
  }

  // Сброс
  public reset(useGLB: boolean): void {
    if (this.collider.debugMesh) {
      this.collider.disableDebug(this.scene);
    }

    // Очищаем все кубики
    this.cubes.forEach((cube) => this.scene.remove(cube));
    this.cubes = [];

    // Очищаем группу
    while (this.children.length > 0) {
      if (this.children[0]) {
        this.remove(this.children[0]);
      }
    }

    // Возвращаем камеру
    this.add(cameraTarget);

    // Сбрасываем состояние
    this.currentLane = this.config.startLane;
    this.position.copy(this.config.startPosition);
    this.rotation.set(0, 0, 0);

    this.state = {
      isJumping: false,
      jumpVelocity: 0,
      targetPitch: 0,
      isDestroyed: false,
      cubes: [],
    };
    this.offRoadVelocity = null;
    this.offRoadGameOverTimer = 0;
    this.gameOverCameraPosition = null;
    this.edgeBumpDirection = null;
    this.edgeBumpTimer = 0;

    this.physics.reset();

    // console.log(
    //   "[DEBUG Car.reset] before build, isShieldEnabled=%s, armor=%s",
    //   usePlayerStore().isShieldEnabled,
    //   usePlayerStore().armor,
    // );

    // Перестраиваем машину
    this.build(useGLB).then(() => {
    //   console.log("[DEBUG Car.reset] build completed");
      if (useGameState().isDebug) this.collider.enableDebug(this.scene);
      // Восстанавливаем визуальные эффекты после перестройки
      const player = usePlayerStore();
    //   console.log(
    //     "[DEBUG Car.reset] after build, isShieldEnabled=%s, armor=%s",
    //     player.isShieldEnabled,
    //     player.armor,
    //   );
      if (player.isShieldEnabled && player.armor > 0) {
        // console.log("[DEBUG Car.reset] calling enableShield");
        this.enableShield();
      }
    });
  }

  private clearCubes(): void {
    this.cubes.forEach((cube) => {
      this.remove(cube);
    });
    this.cubes = [];
  }

  public applyVisualConfig(): void {
    if (!this.visualState) return;

    const playerStore = usePlayerStore();
    this.visualState.preloadTextures(playerStore.CAR_MATERIAL_CONFIG_EXTRA);

    Object.entries(playerStore.CAR_EMISSION_CONFIG_EXTRA).forEach(([k, v]) => {
      this.visualState?.setEmissiveColor(k as CarVisualEffect, v);
    });

    this.visualState.refresh();
  }

  // Геттеры
  public isDestroyed(): boolean {
    return this.state.isDestroyed;
  }

  public getGameOverCameraPosition(): THREE.Vector3 | null {
    return this.gameOverCameraPosition?.clone() ?? null;
  }

  public getCameraFollowPosition(): THREE.Vector3 {
    return this.gameOverCameraPosition?.clone() ?? this.position.clone();
  }

  public isJumping(): boolean {
    return this.state.isJumping;
  }

  public getCubes(): THREE.Object3D[] {
    if (this.offRoadVelocity) return [];
    return [...this.cubes];
  }

  public getState(): CarState {
    return { ...this.state };
  }

  public getStats(): {
    currentLane: number;
    position: THREE.Vector3;
    isDestroyed: boolean;
  } {
    return {
      currentLane: this.currentLane,
      position: this.position.clone(),
      isDestroyed: this.state.isDestroyed,
    };
  }

  public toggleDebugCollider(enable: boolean = true): void {
    if (enable) {
      this.collider.enableDebug(this.scene);
    } else {
      this.collider.disableDebug(this.scene);
    }
  }

  public enableNitro() {
    this.visualState?.enable("nitro" as CarVisualEffect);
  }

  public disableNitro() {
    this.visualState?.disable("nitro" as CarVisualEffect);
  }

  public enableShield() {
    this.visualState?.enable("shield" as CarVisualEffect);
  }

  public disableShield() {
    this.visualState?.disable("shield" as CarVisualEffect);
  }

  public showDamage() {
    this.visualState?.enable("damage" as CarVisualEffect);

    setTimeout(() => {
      this.visualState?.disable("damage" as CarVisualEffect);
    }, 400);
  }

  public getShieldSourceMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];

    for (const cube of this.cubes) {
      cube.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          meshes.push(obj);
        }
      });
    }

    return meshes;
  }
}
