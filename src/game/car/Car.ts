import * as THREE from "three";
import { cameraTarget } from "@/game/camera/cameraTarget.js";
import { RoadManager } from "../road/RoadManager.js";
import { type CarState, type CarConfig } from "./types";
import { DEFAULT_CAR_CONFIG } from "./config";
import { CarCollider } from "./CarCollider";
import { CarCubesBuilder } from "./CarCubesBuilder";
import { CarPhysics } from "./CarPhysics";

export class Car extends THREE.Group {
  private scene: THREE.Scene;
  private state: CarState;
  private collider: CarCollider;
  private builder: CarCubesBuilder;
  private physics: CarPhysics;
  private config: Required<CarConfig>;

  private currentLane: number;
  private cubes: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene, config: Partial<CarConfig> = {}) {
    super();
    // Сначала сохраняем scene
    this.scene = scene;

    this.config = { ...DEFAULT_CAR_CONFIG, ...config };
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
    // this.collider.createDebugCollider(scene);

    this.builder = new CarCubesBuilder();
    this.physics = new CarPhysics(this.config);

    this.position.copy(this.config.startPosition);
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
    if (this.currentLane > 0 && !this.state.isDestroyed) {
      this.currentLane--;
    }
  }

  public moveRight(): void {
    const roadManager = RoadManager.getInstance();
    const maxLane = roadManager.getLanesCount() - 1;

    if (this.currentLane < maxLane && !this.state.isDestroyed) {
      this.currentLane++;
    }
  }

  // Прыжок
  public jump(): void {
    if (!this.state.isDestroyed && !this.state.isJumping) {
      this.physics.startJump(this.position.y);
    }
  }

  // Обновление
  public update(): void {
    if (this.state.isDestroyed) {
      this.physics.updateDestroyedCubes(this.cubes, this.scene);
      return;
    }

    const roadManager = RoadManager.getInstance();
    const lanes = roadManager.getLanes();

    // Обновляем позицию по полосам
    const clampedLane = Math.min(
      Math.max(this.currentLane, 0),
      lanes.length - 1,
    );
    const targetX = lanes[clampedLane] || 0;

    const { newX, newRotationY } = this.physics.updateLaneMovement(
      this.position.x,
      targetX,
      this.rotation.y,
    );

    this.position.x = newX;
    this.rotation.y = newRotationY;

    // Обновляем прыжок
    const jumpResult = this.physics.updateJump(this.position.y);
    this.position.y = jumpResult.newY;
    this.state.isJumping = jumpResult.isJumping;
    this.rotation.x += (jumpResult.pitch - this.rotation.x) * 0.2;

    // Обновляем коллайдер
    this.collider.updateFromObject(this);
  }

  // Коллизии
  public checkObstacleCollision(obstacle: THREE.Object3D): boolean {
    if (this.state.isDestroyed) return false;
    return this.collider.checkObstacleCollision(obstacle);
  }

  public checkJumpCollision(jump: THREE.Object3D): boolean {
    if (this.state.isDestroyed) return false;
    return this.collider.checkJumpCollision(jump, this.position);
  }

  public getCollider(): THREE.Box3 {
    return this.collider.getCollider();
  }

  // Построение машины
  public async build(
    useGLB: boolean = true,
    // cubeModelUrl: string = "",
  ): Promise<void> {
    // Очищаем текущую машину
    this.clearCubes();

    // Строим новые кубики
    this.cubes = await this.builder.buildFromCubes(
      useGLB,
      // cubeModelUrl,
      (cube) => {
        this.add(cube);
      },
    );

    this.state.cubes = this.cubes;

    // Добавляем камеру обратно
    this.add(cameraTarget);

    // Обновляем коллайдер
    this.collider.updateFromObject(this);
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
  }

  // Сброс
  public reset(useGLB: boolean): void {
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

    this.physics.reset();

    // Перестраиваем машину
    this.build(useGLB);
  }

  private clearCubes(): void {
    this.cubes.forEach((cube) => {
      this.remove(cube);
    });
    this.cubes = [];
  }

  // Геттеры
  public isDestroyed(): boolean {
    return this.state.isDestroyed;
  }

  public isJumping(): boolean {
    return this.state.isJumping;
  }

  public getCubes(): THREE.Object3D[] {
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

  // Отладка
  public createDebugCollider(): {
    debugMesh: THREE.Mesh;
    updateDebug: () => void;
  } {
    return this.collider.createDebugCollider(this.scene);
  }
}
