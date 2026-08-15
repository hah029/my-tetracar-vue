// src/game/car/CarManager.ts
import { useGameState } from "@/store/gameState";
import { useLevelStore } from "@/store/levelStore";
import { usePlayerStore } from "@/store/playerStore";
import { Car } from "./Car";
import { type CarConfig, type CarStats } from "./types";
import * as THREE from "three";
import { watch, type WatchStopHandle } from "vue";

import nitroFragmentShader from "@/game/shaders/nitro/fragment.glsl";
import nitroVertexShader from "@/game/shaders/nitro/vertex.glsl";
import shieldFragmentShader from "@/game/shaders/shield/fragment.glsl";
import shieldVertexShader from "@/game/shaders/shield/vertex.glsl";

export class CarManager {
  private static instance: CarManager | null = null;
  private car: Car | null = null;
  private scene: THREE.Scene | null = null;
  private nitroLeft: THREE.Mesh | null = null;
  private nitroRight: THREE.Mesh | null = null;
  private nitroMaterial: THREE.ShaderMaterial | null = null;
  private shieldMesh: THREE.Mesh | null = null;
  private shieldMaterial: THREE.ShaderMaterial | null = null;
  private stopPlayerVisualWatcher: WatchStopHandle | null = null;

  private constructor() {}

  public static getInstance(): CarManager {
    if (!CarManager.instance) {
      CarManager.instance = new CarManager();
    }
    return CarManager.instance;
  }

  public initialize(scene: THREE.Scene): void {
    this.scene = scene;
    this.stopPlayerVisualWatcher?.();

    const levelStore = useLevelStore();
    this.stopPlayerVisualWatcher = watch(
      () => levelStore.currentLevel.player.visual,
      () => this.applyPlayerVisualConfig(),
      { deep: true },
    );
  }

  public createCar(config?: CarConfig): Car {
    if (!this.scene) {
      throw new Error(
        "CarManager not initialized with scene. Call initialize() first.",
      );
    }

    if (this.car) {
      this.destroyCar();
    }

    this.car = new Car(this.scene, config);
    this.createNitroEffect();
    this.createShieldEffect();

    return this.car;
  }

  private createNitroEffect(): void {
    if (!this.car) return;

    this.disposeNitroEffect();

    const nitroTrail = usePlayerStore().getNitroTrailConfig();
    const geometry = new THREE.PlaneGeometry(
      nitroTrail.width,
      nitroTrail.height,
    );

    this.nitroMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(nitroTrail.color) },
      },
      vertexShader: nitroVertexShader,
      fragmentShader: nitroFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    this.nitroLeft = new THREE.Mesh(geometry, this.nitroMaterial);
    this.nitroRight = new THREE.Mesh(geometry, this.nitroMaterial);

    this.nitroLeft.position.set(
      -nitroTrail.offsetX,
      nitroTrail.offsetY,
      nitroTrail.offsetZ,
    );
    this.nitroRight.position.set(
      nitroTrail.offsetX,
      nitroTrail.offsetY,
      nitroTrail.offsetZ,
    );

    this.nitroLeft.rotation.y = Math.PI / 2;
    this.nitroRight.rotation.y = -Math.PI / 2;

    this.nitroLeft.visible = false;
    this.nitroRight.visible = false;

    this.car.add(this.nitroLeft);
    this.car.add(this.nitroRight);
  }

  private disposeNitroEffect(): void {
    if (this.car) {
      if (this.nitroLeft) this.car.remove(this.nitroLeft);
      if (this.nitroRight) this.car.remove(this.nitroRight);
    }

    this.nitroLeft?.geometry.dispose();
    this.nitroMaterial?.dispose();

    this.nitroLeft = null;
    this.nitroRight = null;
    this.nitroMaterial = null;
  }

  private applyPlayerVisualConfig(): void {
    if (!this.car) return;

    this.createNitroEffect();
    this.createShieldEffect();
    this.car.applyVisualConfig();
  }

  private createShieldEffect(): void {
    if (!this.car) return;

    this.disposeShieldEffect();

    const shield = usePlayerStore().getShieldConfig();
    this.shieldMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(shield.color) },
        opacity: { value: shield.opacity },
      },
      vertexShader: shieldVertexShader,
      fragmentShader: shieldFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    this.shieldMesh = new THREE.Mesh(
      new THREE.SphereGeometry(shield.radius, 40, 24),
      this.shieldMaterial,
    );
    this.shieldMesh.position.set(0, shield.offsetY, shield.offsetZ);
    this.shieldMesh.scale.set(shield.scaleX, shield.scaleY, shield.scaleZ);
    this.shieldMesh.visible = false;
    this.shieldMesh.renderOrder = 1;

    this.car.add(this.shieldMesh);
  }

  private disposeShieldEffect(): void {
    if (this.car && this.shieldMesh) this.car.remove(this.shieldMesh);

    this.shieldMesh?.geometry.dispose();
    this.shieldMaterial?.dispose();
    this.shieldMesh = null;
    this.shieldMaterial = null;
  }

  public update(dt: number): void {
    if (!this.car) return;

    this.car.update(dt);
    this.car.toggleDebugCollider(useGameState().isDebug);

    if (this.nitroMaterial) {
      this.nitroMaterial.uniforms.time.value +=
        dt * usePlayerStore().getNitroTrailConfig().timeScale;
    }
    if (this.shieldMaterial) {
      this.shieldMaterial.uniforms.time.value +=
        dt * usePlayerStore().getShieldConfig().timeScale;
    }
    if (this.shieldMesh) {
      this.shieldMesh.visible = usePlayerStore().isShieldEnabled;
    }
  }

  public moveLeft(): void {
    this.car?.moveLeft();
  }

  public moveRight(): void {
    this.car?.moveRight();
  }

  public jump(): void {
    this.car?.jump();
  }

  public async buildCar(useGLB: boolean = true): Promise<void> {
    if (this.car) {
      await this.car.build(useGLB);
      // this.createShieldEffect();
      this.car.toggleDebugCollider(useGameState().isDebug);
    }
  }

  public resetCar(): void {
    this.car?.reset(true);
  }

  public destroyCar(): void {
    if (!this.car) return;

    if (this.scene) {
      this.scene.remove(this.car);

      // const field = this.car.userData.magnetField;
      // if (field) this.scene.remove(field);
    }

    this.disposeNitroEffect();
    this.disposeShieldEffect();

    this.car = null;
  }

  public dispose(): void {
    this.stopPlayerVisualWatcher?.();
    this.stopPlayerVisualWatcher = null;
    this.destroyCar();
    this.scene = null;
  }

  public getCar(): Car {
    if (!this.car) {
      throw new Error("Car not created. Call createCar() first.");
    }

    return this.car;
  }

  public getStats(): CarStats | null {
    if (!this.car) return null;

    return {
      currentLane: this.car.getCurrentLane(),
      position: this.car.position.clone(),
      isDestroyed: this.car.isDestroyed(),
      isJumping: this.car.isJumping(),
      cubesCount: this.car.getCubes().length,
    };
  }

  public isReady(): boolean {
    return this.car !== null;
  }

  public enableNitro(): void {
    this.car?.enableNitro();

    if (this.nitroLeft) this.nitroLeft.visible = true;
    if (this.nitroRight) this.nitroRight.visible = true;
  }

  public disableNitro(): void {
    this.car?.disableNitro();

    if (this.nitroLeft) this.nitroLeft.visible = false;
    if (this.nitroRight) this.nitroRight.visible = false;
  }

  public enableShield(): void {
    this.car?.enableShield();
    if (this.shieldMesh) this.shieldMesh.visible = true;
  }

  public disableShield(): void {
    this.car?.disableShield();
    if (this.shieldMesh) this.shieldMesh.visible = false;
  }
}
