// src/game/car/CarManager.ts

import { useGameState } from "@/store/gameState";
import { Car } from "./Car";
import { type CarConfig, type CarStats } from "./types";
import * as THREE from "three";
import { CoinManager } from "../interactive/items/coin/CoinManager";

import nitroFragmentShader from "@/game/shaders/nitro/fragment.glsl";
import nitroVertexShader from "@/game/shaders/nitro/vertex.glsl";
import { MagnetSystem } from "../magnet/MagnetSystem";
// import shieldFragmentShader from "@/game/shaders/shield/fragment.glsl";
// import shieldVertexShader from "@/game/shaders/shield/vertex.glsl";

export class CarManager {
  private static instance: CarManager | null = null;
  private car: Car | null = null;
  private scene: THREE.Scene | null = null;
  private nitroLeft: THREE.Mesh | null = null;
  private nitroRight: THREE.Mesh | null = null;
  private nitroMaterial: THREE.ShaderMaterial | null = null;
  // private shieldMesh: THREE.Mesh | null = null;
  // private shieldMaterial: THREE.ShaderMaterial | null = null;

  private constructor() {}

  public static getInstance(): CarManager {
    if (!CarManager.instance) {
      CarManager.instance = new CarManager();
    }
    return CarManager.instance;
  }

  public initialize(scene: THREE.Scene): void {
    this.scene = scene;
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

    // const field = MagnetSystem.getInstance().createMagnetField();

    // this.scene.add(field);
    // this.car.userData.magnetField = field;
    // field.visible = false;

    this.createNitroEffect();

    return this.car;
  }

  private createNitroEffect(): void {
    if (!this.car) return;

    const geometry = new THREE.PlaneGeometry(2.2, 0.8);

    this.nitroMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color("#66ff66") },
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

    this.nitroLeft.position.set(-0.85, 0.25, 2);
    this.nitroRight.position.set(0.85, 0.25, 2);

    this.nitroLeft.rotation.y = Math.PI / 2;
    this.nitroRight.rotation.y = -Math.PI / 2;

    this.nitroLeft.visible = false;
    this.nitroRight.visible = false;

    this.car.add(this.nitroLeft);
    this.car.add(this.nitroRight);
  }

  // private createShieldEffect(): void {
  //   if (!this.car) return;

  //   const meshes = this.car.getShieldSourceMeshes();
  //   const group = new THREE.Group();

  //   this.shieldMaterial = new THREE.ShaderMaterial({
  //     uniforms: {
  //       time: { value: 0 },
  //       color: { value: new THREE.Color("#ff0000") },
  //     },

  //     vertexShader: shieldVertexShader,
  //     fragmentShader: shieldFragmentShader,
  //     transparent: true,
  //     depthWrite: false,
  //     wireframe: true,
  //     blending: THREE.AdditiveBlending,
  //   });

  //   // this.shieldMesh = new THREE.Mesh(geometry, this.shieldMaterial);
  //   meshes.forEach((mesh) => {
  //     const clone = new THREE.Mesh(mesh.geometry, this.shieldMaterial!);

  //     clone.position.copy(mesh.position);
  //     clone.rotation.copy(mesh.rotation);
  //     clone.scale.copy(mesh.scale);

  //     group.add(clone);
  //   });

  //   group.scale.setScalar(1.1);
  //   group.visible = true;

  //   this.shieldMesh = group as any;
  //   this.car.add(group);
  // }

  public update(dt: number): void {
    if (!this.car) return;

    this.car.update(dt);
    this.car.toggleDebugCollider(useGameState().isDebug);

    if (this.nitroMaterial) {
      this.nitroMaterial.uniforms.time.value += dt * 4.0;
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

    this.nitroLeft?.geometry.dispose();
    this.nitroRight?.geometry.dispose();
    this.nitroMaterial?.dispose();

    this.nitroLeft = null;
    this.nitroRight = null;
    this.nitroMaterial = null;

    this.car = null;
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

    // if (this.shieldMesh) this.shieldMesh.visible = true;
  }

  public disableShield(): void {
    this.car?.disableShield();

    // if (this.shieldMesh) this.shieldMesh.visible = false;
  }
}
