import * as THREE from "three";
import type { WeatherConfig } from "@/levels/types";

export class WeatherEffects {
  private rainMesh: THREE.InstancedMesh | null = null;
  private rainPositions: THREE.Vector3[] = [];
  private rainDummy = new THREE.Object3D();
  private lightningLight: THREE.PointLight | null = null;
  private lightningElapsed = 0;
  private nextLightning = Number.POSITIVE_INFINITY;
  private flashElapsed = 0;

  constructor(
    private scene: THREE.Scene,
    private config: WeatherConfig,
  ) {
    this.createRain();
    this.createLightning();
  }

  public update(deltaTime: number, baseSpeed: number): void {
    const dtSeconds = deltaTime / 1000;
    this.updateRain(deltaTime, baseSpeed);
    this.updateLightning(dtSeconds);
  }

  public dispose(): void {
    if (this.rainMesh) {
      this.scene.remove(this.rainMesh);
      this.rainMesh.geometry.dispose();
      if (Array.isArray(this.rainMesh.material)) {
        this.rainMesh.material.forEach((material) => material.dispose());
      } else {
        this.rainMesh.material.dispose();
      }
      this.rainMesh = null;
    }

    if (this.lightningLight) {
      this.scene.remove(this.lightningLight);
      this.lightningLight.dispose();
      this.lightningLight = null;
    }

    this.rainPositions = [];
  }

  private createRain(): void {
    const rain = this.config.rain;
    if (!rain?.enabled || rain.count <= 0) return;

    const geometry = new THREE.BoxGeometry(0.035, rain.dropLength, 0.035);
    const material = new THREE.MeshBasicMaterial({
      color: Number.parseInt(rain.color.replace("#", ""), 16),
      transparent: rain.opacity < 1,
      opacity: rain.opacity,
      depthWrite: false,
    });

    this.rainMesh = new THREE.InstancedMesh(geometry, material, rain.count);
    this.rainMesh.frustumCulled = false;

    for (let i = 0; i < rain.count; i++) {
      const position = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(rain.areaWidth),
        THREE.MathUtils.randFloat(0, rain.height),
        THREE.MathUtils.randFloat(-rain.areaDepth, rain.areaDepth * 0.35),
      );
      this.rainPositions.push(position);
      this.writeRainMatrix(i, position);
    }

    this.rainMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.rainMesh);
  }

  private updateRain(deltaTime: number, baseSpeed: number): void {
    const rain = this.config.rain;
    if (!rain?.enabled || !this.rainMesh) return;

    const dtSeconds = deltaTime / 1000;
    const forwardMove = deltaTime * baseSpeed * 0.12;

    for (let i = 0; i < this.rainPositions.length; i++) {
      const position = this.rainPositions[i];
      if (!position) continue;

      position.x += (rain.windX ?? -7) * dtSeconds;
      position.y -= rain.fallSpeed * dtSeconds;
      position.z += forwardMove + (rain.windZ ?? 0) * dtSeconds;

      if (
        position.y < -4 ||
        Math.abs(position.x) > rain.areaWidth * 0.58 ||
        position.z > rain.areaDepth * 0.4
      ) {
        position.x = THREE.MathUtils.randFloatSpread(rain.areaWidth);
        position.y = rain.height;
        position.z = THREE.MathUtils.randFloat(-rain.areaDepth, 0);
      }

      this.writeRainMatrix(i, position);
    }

    this.rainMesh.instanceMatrix.needsUpdate = true;
  }

  private writeRainMatrix(index: number, position: THREE.Vector3): void {
    if (!this.rainMesh) return;

    this.rainDummy.position.copy(position);
    this.rainDummy.rotation.set(0.28, 0, -0.2);
    this.rainDummy.updateMatrix();
    this.rainMesh.setMatrixAt(index, this.rainDummy.matrix);
  }

  private createLightning(): void {
    const lightning = this.config.lightning;
    if (!lightning?.enabled) return;

    const color = Number.parseInt(lightning.color.replace("#", ""), 16);
    this.lightningLight = new THREE.PointLight(color, 0, 900);
    this.lightningLight.position.fromArray(lightning.position ?? [0, 120, -160]);
    this.scene.add(this.lightningLight);
    this.nextLightning = THREE.MathUtils.randFloat(
      lightning.minInterval,
      lightning.maxInterval,
    );
  }

  private updateLightning(dtSeconds: number): void {
    const lightning = this.config.lightning;
    if (!lightning?.enabled || !this.lightningLight) return;

    this.lightningElapsed += dtSeconds;

    if (this.flashElapsed > 0) {
      this.flashElapsed -= dtSeconds;
      const progress = Math.max(this.flashElapsed / lightning.duration, 0);
      this.lightningLight.intensity = lightning.intensity * progress;
      return;
    }

    this.lightningLight.intensity = 0;

    if (this.lightningElapsed >= this.nextLightning) {
      this.lightningElapsed = 0;
      this.flashElapsed = lightning.duration;
      this.nextLightning = THREE.MathUtils.randFloat(
        lightning.minInterval,
        lightning.maxInterval,
      );
    }
  }
}
