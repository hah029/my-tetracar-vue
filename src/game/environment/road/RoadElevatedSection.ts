import * as THREE from "three";
import type { RoadConfig, RoadElevatedSectionConfig } from "./types";
import { loadTexture } from "@/helpers/loaders";
import type { RoadSegmentSurfaceInterval } from "./RoadSegmentSurface";

export class RoadElevatedSection {
  private static readonly SAFE_REMOVE_Z = 90;
  private group = new THREE.Group();
  private meshes: THREE.Mesh[] = [];
  private readonly initialZ: number;
  private readonly totalLength: number;
  private readonly rampLength: number;
  private readonly height: number;
  private readonly speedFactor: number;
  private readonly loop: boolean;
  private readonly rampIn: boolean;
  private readonly rampOut: boolean;

  constructor(
    private scene: THREE.Scene,
    private config: RoadElevatedSectionConfig,
    private roadConfig: RoadConfig,
    private lanePositions: number[],
    private laneWidth: number,
  ) {
    this.initialZ = config.zStart;
    this.totalLength = Math.max(1, config.length);
    this.rampLength = Math.max(
      0.1,
      Math.min(config.rampLength, this.totalLength / 2),
    );
    this.height = config.height;
    this.speedFactor = config.speedFactor ?? 1;
    this.loop = config.loop ?? true;
    this.rampIn = config.rampIn ?? true;
    this.rampOut = config.rampOut ?? true;

    this.group.position.z = this.initialZ;
    this.createMeshes();
    this.scene.add(this.group);
  }

  public update(deltaTime: number, speed: number): boolean {
    this.group.position.z += deltaTime * speed * this.speedFactor;

    if (this.group.position.z > RoadElevatedSection.SAFE_REMOVE_Z) {
      if (!this.loop) return true;
      this.group.position.z = this.initialZ;
    }

    return false;
  }

  public getHeightAt(lane: number, z: number): number {
    if (!this.config.lanes.includes(lane)) return 0;

    const localZ = z - this.group.position.z;
    if (localZ < 0 || localZ > this.totalLength) return 0;

    const nearRampStart = this.totalLength - this.rampLength;
    if (this.rampIn && localZ > nearRampStart) {
      return (
        this.height *
        this.smoothstep((this.totalLength - localZ) / this.rampLength)
      );
    }

    if (this.rampOut && localZ < this.rampLength) {
      return this.height * this.smoothstep(localZ / this.rampLength);
    }

    return this.height;
  }

  public getSurfaceIntervals(): RoadSegmentSurfaceInterval[] {
    return this.config.lanes.map((lane) => ({
      lane,
      back: this.group.position.z,
      front: this.group.position.z + this.totalLength,
    }));
  }

  public dispose(): void {
    this.scene.remove(this.group);

    for (const mesh of this.meshes) {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      } else {
        mesh.material.dispose();
      }
    }

    this.group.clear();
    this.meshes = [];
  }

  private createMeshes(): void {
    const plateauStart = this.rampOut ? this.rampLength : 0;
    const plateauEnd = this.totalLength - (this.rampIn ? this.rampLength : 0);
    const plateauLength = Math.max(0.1, plateauEnd - plateauStart);

    for (const lane of this.config.lanes) {
      const x = this.lanePositions[lane];
      if (x === undefined) continue;

      if (this.rampOut) {
        this.addRamp(x, this.rampLength / 2, false);
      }
      this.addPlateau(x, plateauStart + plateauLength / 2, plateauLength);
      if (this.rampIn) {
        this.addRamp(x, this.totalLength - this.rampLength / 2, true);
      }
    }
  }

  private addPlateau(x: number, z: number, length: number): void {
    const geometry = new THREE.BoxGeometry(this.laneWidth * 0.92, 0.22, length);
    const mesh = new THREE.Mesh(geometry, this.createMaterial(length));
    mesh.position.set(x, this.height - 0.11, z);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.meshes.push(mesh);
  }

  private addRamp(x: number, z: number, descending: boolean): void {
    const geometry = new THREE.BoxGeometry(
      this.laneWidth * 0.92,
      0.18,
      this.rampLength * 1.02,
    );
    const mesh = new THREE.Mesh(geometry, this.createMaterial(this.rampLength));
    mesh.position.set(x, this.height / 2 - 0.09, z);
    mesh.rotation.x = descending
      ? Math.atan2(this.height, this.rampLength)
      : -Math.atan2(this.height, this.rampLength);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.meshes.push(mesh);
  }

  private createMaterial(length: number): THREE.MeshStandardMaterial {
    const map = this.roadConfig.textureUrl
      ? loadTexture(this.roadConfig.textureUrl, {
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.RepeatWrapping,
          repeat: {
            x: Math.max(this.laneWidth / 2, 1),
            y: Math.max(length / 2, 1),
          },
        })
      : undefined;

    return new THREE.MeshStandardMaterial({
      map,
      color: this.roadConfig.color ?? 0xffffff,
      emissive: this.roadConfig.emissive ?? this.roadConfig.color ?? 0xffffff,
      emissiveIntensity: this.roadConfig.emissiveIntensity ?? 0.1,
      transparent: (this.roadConfig.opacity ?? 1) < 1,
      opacity: this.roadConfig.opacity ?? 1,
      roughness: 0.62,
      metalness: 0.08,
    });
  }

  private smoothstep(value: number): number {
    const x = THREE.MathUtils.clamp(value, 0, 1);
    return x * x * (3 - 2 * x);
  }
}
