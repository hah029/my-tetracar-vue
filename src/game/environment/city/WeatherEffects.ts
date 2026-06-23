import * as THREE from "three";
import type { WeatherConfig } from "@/levels/types";

export class WeatherEffects {
  private rainMesh: THREE.InstancedMesh | null = null;
  private rainPositions: THREE.Vector3[] = [];
  private rainDummy = new THREE.Object3D();
  private lightningLight: THREE.PointLight | null = null;
  private lightningBolt: THREE.Group | null = null;
  private lightningMaterials: THREE.MeshBasicMaterial[] = [];
  private headlightGroup: THREE.Group | null = null;
  private headlights: THREE.SpotLight[] = [];
  private headlightTargets: THREE.Object3D[] = [];
  private headlightBeams: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>[] =
    [];
  private lightningElapsed = 0;
  private nextLightning = Number.POSITIVE_INFINITY;
  private flashElapsed = 0;

  constructor(
    private scene: THREE.Scene,
    private config: WeatherConfig,
  ) {
    this.createRain();
    this.createLightning();
    this.createHeadlights();
  }

  public update(
    deltaTime: number,
    baseSpeed: number,
    carPosition?: THREE.Vector3,
  ): void {
    const dtSeconds = deltaTime / 1000;
    this.updateRain(deltaTime, baseSpeed);
    this.updateLightning(dtSeconds);
    this.updateHeadlights(carPosition);
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

    this.clearLightningBolt();
    if (this.lightningBolt) {
      this.scene.remove(this.lightningBolt);
      this.lightningBolt = null;
    }
    this.lightningMaterials = [];
    this.disposeHeadlights();
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

  private createHeadlights(): void {
    const headlights = this.config.headlights;
    if (!headlights?.enabled) return;

    const color = Number.parseInt(headlights.color.replace("#", ""), 16);
    this.headlightGroup = new THREE.Group();
    this.scene.add(this.headlightGroup);

    for (const offset of headlights.positionOffsets) {
      const light = new THREE.SpotLight(
        color,
        headlights.intensity,
        headlights.distance,
        headlights.angle,
        headlights.penumbra,
        headlights.decay,
      );
      light.castShadow = false;

      const target = new THREE.Object3D();
      this.scene.add(target);
      light.target = target;

      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(
          headlights.beamRadius,
          headlights.beamLength,
          32,
          1,
          true,
        ),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: headlights.beamOpacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
      );
      beam.rotation.x = Math.PI / 2;
      beam.frustumCulled = false;
      beam.renderOrder = 8;

      this.headlights.push(light);
      this.headlightTargets.push(target);
      this.headlightBeams.push(beam);
      this.headlightGroup.add(light, beam);
    }

    this.updateHeadlights();
  }

  private updateHeadlights(carPosition?: THREE.Vector3): void {
    const headlights = this.config.headlights;
    if (!headlights?.enabled || !this.headlightGroup) return;

    const origin = carPosition ?? new THREE.Vector3(0, 0, 0);

    for (let i = 0; i < this.headlights.length; i++) {
      const offset = headlights.positionOffsets[i];
      const light = this.headlights[i];
      const target = this.headlightTargets[i];
      const beam = this.headlightBeams[i];

      if (!offset || !light || !target || !beam) continue;

      const x = origin.x + offset[0];
      const y = origin.y + offset[1];
      const z = origin.z + offset[2];

      light.position.set(x, y, z);
      target.position.set(x * 0.35, y - 0.55, z - headlights.targetDistance);

      beam.position.set(x, y - 0.08, z - headlights.beamLength / 2);
      beam.scale.set(1, 1, 1);
    }
  }

  private disposeHeadlights(): void {
    if (!this.headlightGroup) return;

    for (const light of this.headlights) {
      this.headlightGroup.remove(light);
      light.dispose();
    }

    for (const target of this.headlightTargets) {
      this.scene.remove(target);
    }

    for (const beam of this.headlightBeams) {
      this.headlightGroup.remove(beam);
      beam.geometry.dispose();
      beam.material.dispose();
    }

    this.scene.remove(this.headlightGroup);
    this.headlightGroup = null;
    this.headlights = [];
    this.headlightTargets = [];
    this.headlightBeams = [];
  }

  private createLightning(): void {
    const lightning = this.config.lightning;
    if (!lightning?.enabled) return;

    const color = Number.parseInt(lightning.color.replace("#", ""), 16);
    this.lightningLight = new THREE.PointLight(color, 0, 900);
    this.lightningLight.position.fromArray(lightning.position ?? [0, 120, -160]);
    this.scene.add(this.lightningLight);

    this.lightningBolt = new THREE.Group();
    this.lightningBolt.visible = false;
    this.lightningBolt.renderOrder = 20;
    this.scene.add(this.lightningBolt);

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
      this.setLightningBoltOpacity(progress);

      if (this.flashElapsed <= 0) {
        this.clearLightningBolt();
      }

      return;
    }

    this.lightningLight.intensity = 0;
    this.clearLightningBolt();

    if (this.lightningElapsed >= this.nextLightning) {
      this.lightningElapsed = 0;
      this.flashElapsed = lightning.duration;
      this.spawnLightningBolt();
      this.nextLightning = THREE.MathUtils.randFloat(
        lightning.minInterval,
        lightning.maxInterval,
      );
    }
  }

  private spawnLightningBolt(): void {
    const lightning = this.config.lightning;
    if (!lightning?.enabled || !this.lightningBolt) return;

    this.clearLightningBolt();

    const color = Number.parseInt(lightning.color.replace("#", ""), 16);
    const coreMaterial = this.createLightningMaterial(color, 0.95);
    const glowMaterial = this.createLightningMaterial(color, 0.3);
    this.lightningMaterials = [coreMaterial, glowMaterial];

    const source = new THREE.Vector3().fromArray(
      lightning.position ?? [0, 120, -160],
    );
    const target = new THREE.Vector3(
      THREE.MathUtils.randFloat(-55, 55),
      THREE.MathUtils.randFloat(3, 12),
      THREE.MathUtils.randFloat(-95, -45),
    );
    const mainPoints = this.createLightningPath(source, target, 13, 18);

    this.lightningBolt.add(
      this.createLightningTube(mainPoints, 0.16, coreMaterial),
      this.createLightningTube(mainPoints, 0.46, glowMaterial),
    );

    for (let i = 2; i < mainPoints.length - 2; i += 2) {
      if (Math.random() > 0.72) continue;

      const branchStart = mainPoints[i];
      if (!branchStart) continue;

      const branchEnd = branchStart
        .clone()
        .add(
          new THREE.Vector3(
            THREE.MathUtils.randFloat(-24, 24),
            THREE.MathUtils.randFloat(-18, 4),
            THREE.MathUtils.randFloat(-12, 18),
          ),
        );
      const branchPoints = this.createLightningPath(branchStart, branchEnd, 5, 6);
      this.lightningBolt.add(
        this.createLightningTube(branchPoints, 0.07, coreMaterial),
        this.createLightningTube(branchPoints, 0.24, glowMaterial),
      );
    }

    this.lightningBolt.visible = true;
    this.setLightningBoltOpacity(1);
  }

  private createLightningPath(
    start: THREE.Vector3,
    end: THREE.Vector3,
    segments: number,
    jitter: number,
  ): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = start.clone().lerp(end, t);
      const taper = Math.sin(t * Math.PI);
      point.x += THREE.MathUtils.randFloatSpread(jitter) * taper;
      point.y += THREE.MathUtils.randFloatSpread(jitter * 0.45) * taper;
      point.z += THREE.MathUtils.randFloatSpread(jitter * 0.65) * taper;
      points.push(point);
    }

    return points;
  }

  private createLightningTube(
    points: THREE.Vector3[],
    radius: number,
    material: THREE.MeshBasicMaterial,
  ): THREE.Mesh<THREE.TubeGeometry, THREE.MeshBasicMaterial> {
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(
      curve,
      Math.max(8, points.length * 3),
      radius,
      6,
      false,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 20;
    return mesh;
  }

  private createLightningMaterial(
    color: number,
    opacity: number,
  ): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  private setLightningBoltOpacity(progress: number): void {
    if (!this.lightningBolt) return;

    const flicker = 0.72 + Math.random() * 0.28;
    for (let i = 0; i < this.lightningMaterials.length; i++) {
      const material = this.lightningMaterials[i];
      if (!material) continue;
      material.opacity = (i === 0 ? 0.95 : 0.3) * progress * flicker;
    }
  }

  private clearLightningBolt(): void {
    if (!this.lightningBolt || !this.lightningBolt.visible) return;

    for (const child of this.lightningBolt.children) {
      const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
      mesh.geometry.dispose();
    }

    this.lightningBolt.clear();
    this.lightningBolt.visible = false;

    for (const material of this.lightningMaterials) {
      material.dispose();
    }
    this.lightningMaterials = [];
  }
}
