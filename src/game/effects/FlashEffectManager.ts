import * as THREE from "three";
import { CameraSystem } from "../camera/CameraSystem";
import flashVertexShader from "@/game/shaders/flash/vertex.glsl";
import flashFragmentShader from "@/game/shaders/flash/fragment.glsl";

import explosionVertexShader from "@/game/shaders/explosion/vertex.glsl";
import explosionFragmentShader from "@/game/shaders/explosion/fragment.glsl";

import landingWaveVertexShader from "@/game/shaders/landingWave/vertex.glsl";
import landingWaveFragmentShader from "@/game/shaders/landingWave/fragment.glsl";

import { useCommonStore } from "@/store/commonStore";

// Типы эффектов
export type FlashType =
  | "golden"
  | "energon"
  | "nitro"
  | "shield"
  | "magnet"
  | "bullet";

interface FlashEffect {
  mesh: THREE.Mesh;
  createdAt: number;
  duration: number;
  billboard?: boolean;
}

export class FlashEffectManager {
  private static instance: FlashEffectManager | null = null;
  private effects: FlashEffect[] = [];
  private scene: THREE.Scene | null = null;

  public static getInstance(): FlashEffectManager {
    if (!FlashEffectManager.instance) {
      FlashEffectManager.instance = new FlashEffectManager();
    }
    return FlashEffectManager.instance;
  }

  private getColor(type: FlashType) {
    switch (type) {
      case "golden":
        return new THREE.Color("#ffd54a");

      case "energon":
        return new THREE.Color("#00e5ff");

      case "nitro":
        return new THREE.Color("#66ff66");

      case "shield":
        return new THREE.Color("#dcdcdc");

      case "magnet":
        return new THREE.Color("#0008ff");

      case "bullet":
        return new THREE.Color("#ff5533");
    }
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnFlash(
    type: FlashType,
    position: THREE.Vector3,
    size = useCommonStore().FLASH_SIZE_DEFAULT,
    duration = useCommonStore().FLASH_DURATION_DEFAULT,
  ) {
    if (!this.scene) return;

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,

      uniforms: {
        uTime: { value: 0 },
        uColor: { value: this.getColor(type) },
      },

      vertexShader: flashVertexShader,
      fragmentShader: flashFragmentShader,
      toneMapped: false,
    });

    const mesh = new THREE.Mesh(new THREE.CircleGeometry(size), material);

    mesh.position.copy(position);
    mesh.position.y += 0.5;

    this.scene.add(mesh);

    this.effects.push({
      mesh,
      createdAt: performance.now(),
      duration,
      billboard: true,
    });
  }

  spawnExplosion(
    type: FlashType,
    position: THREE.Vector3,
    size = useCommonStore().EXPLOSION_SIZE_DEFAULT,
    duration = useCommonStore().EXPLOSION_DURATION_DEFAULT,
  ) {
    if (!this.scene) return;

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,

      uniforms: {
        uTime: { value: 0 },
        uColor: { value: this.getColor(type) },
      },

      vertexShader: explosionVertexShader,
      fragmentShader: explosionFragmentShader,
    });

    const mesh = new THREE.Mesh(new THREE.CircleGeometry(size), material);

    mesh.position.copy(position);
    mesh.position.y += 0.5;

    this.scene.add(mesh);

    this.effects.push({
      mesh,
      createdAt: performance.now(),
      duration,
      billboard: true,
    });
  }

  spawnLandingWave(position: THREE.Vector3, size = 10, duration = 200) {
    if (!this.scene) return;

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      // depthTest: true,

      blending: THREE.AdditiveBlending,

      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#ffffff7b") },
      },

      vertexShader: landingWaveVertexShader,
      fragmentShader: landingWaveFragmentShader,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);

    // кладем на землю
    mesh.rotation.x = -Math.PI / 2;

    mesh.position.copy(position);
    // mesh.position.y += 0.03;

    this.scene.add(mesh);

    this.effects.push({
      mesh,
      createdAt: performance.now(),
      duration,
      billboard: false,
    });

    CameraSystem.triggerImpactShake(10, 200);
  }

  update(now = performance.now()) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];

      const progress = (now - fx.createdAt) / fx.duration;

      if (progress >= 1) {
        this.destroyEffect(fx);
        this.effects.splice(i, 1);
        continue;
      }

      if (fx.billboard) {
        fx.mesh.lookAt(CameraSystem.getCamera()!.position);
      }

      const mat = fx.mesh.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = progress;

      const scale = 1 + progress * 0.7;
      fx.mesh.scale.set(scale, scale, 1);
    }
  }

  private destroyEffect(effect: FlashEffect) {
    this.scene?.remove(effect.mesh);

    effect.mesh.geometry.dispose();

    const mat = effect.mesh.material;
    Array.isArray(mat) ? mat.forEach((m) => m.dispose()) : mat.dispose();
  }

  public clear() {
    for (const fx of this.effects) {
      this.destroyEffect(fx);
    }

    this.effects.length = 0;
  }
}
