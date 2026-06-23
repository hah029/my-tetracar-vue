import * as THREE from "three";
import type { CityLayerConfig } from "./types";

export class ProceduralSceneryLayerInstanced {
  private mesh: THREE.InstancedMesh;
  private positions: THREE.Vector3[] = [];
  private scales: THREE.Vector3[] = [];
  private dummy = new THREE.Object3D();

  private readonly loopThreshold = 10;

  constructor(
    private scene: THREE.Scene,
    private config: CityLayerConfig,
  ) {
    const count = Math.ceil((config.zEnd - config.zStart) / config.spacing) + 2;
    this.mesh = new THREE.InstancedMesh(
      this.createGeometry(config.type),
      this.createMaterial(config),
      count,
    );

    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false;

    for (let i = 0; i < count; i++) {
      const z = config.zStart + i * config.spacing;
      const x = THREE.MathUtils.randFloat(config.xMin, config.xMax);
      const height = THREE.MathUtils.randFloat(config.minHeight, config.maxHeight);
      const width = THREE.MathUtils.randFloat(config.minWidth, config.maxWidth);
      const depth = this.resolveDepth(config.type, width);

      const position = new THREE.Vector3(x, config.y + height / 2, z);
      const scale = new THREE.Vector3(width, height, depth);

      this.positions.push(position);
      this.scales.push(scale);
      this.writeMatrix(i, position, scale);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.mesh);
  }

  public update(deltaTime: number, baseSpeed: number) {
    const move = deltaTime * baseSpeed * this.config.speedFactor;
    const cycleLength = this.config.zEnd - this.config.zStart;

    for (let i = 0; i < this.positions.length; i++) {
      const position = this.positions[i];
      const scale = this.scales[i];
      if (!position || !scale) continue;

      position.z += move;

      if (position.z > this.loopThreshold) {
        position.z -= cycleLength;
      }

      this.writeMatrix(i, position, scale);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();

    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((material) => material.dispose());
    } else {
      this.mesh.material.dispose();
    }

    this.positions = [];
    this.scales = [];
  }

  private writeMatrix(index: number, position: THREE.Vector3, scale: THREE.Vector3) {
    this.dummy.position.copy(position);
    this.dummy.scale.copy(scale);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.updateMatrix();
    this.mesh.setMatrixAt(index, this.dummy.matrix);
  }

  private createGeometry(type: CityLayerConfig["type"]): THREE.BufferGeometry {
    switch (type) {
      case "hills":
        return new THREE.ConeGeometry(0.5, 1, 8, 1);
      case "ocean":
        return new THREE.BoxGeometry(1, 1, 1);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  private createMaterial(config: CityLayerConfig): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissive ?? 0x000000,
      emissiveIntensity: config.emissiveIntensity ?? 0,
      transparent: (config.opacity ?? 1) < 1,
      opacity: config.opacity ?? 1,
      roughness: 0.85,
      metalness: config.type === "ocean" ? 0.15 : 0,
    });
  }

  private resolveDepth(type: CityLayerConfig["type"], width: number): number {
    if (type === "ocean") return Math.max(2, width * 0.35);
    return width;
  }
}
