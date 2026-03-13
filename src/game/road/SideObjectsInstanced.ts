// /game/road/SideObjectsInstanced.ts

import * as THREE from "three";
import { CubeBuilder } from "../cube/Cube";
import {
  SIDE_OBJECT_GEOMETRY_CONFIG,
  SIDE_OBJECT_MATERIAL_CONFIG,
} from "./config/SideObjectConfig";

export class SideObjectsInstanced {
  private mesh!: THREE.InstancedMesh;
  private positions: THREE.Vector3[] = [];

  private dummy = new THREE.Object3D();

  private spacing: number;
  private count: number;
  private scene: THREE.Scene;
  private x: number;

  constructor(
    scene: THREE.Scene,
    x: number,
    spacing: number,
    startZ: number,
    endZ: number,
  ) {
    this.scene = scene;
    this.x = x;
    this.spacing = spacing;
    this.count = Math.ceil((endZ - startZ) / spacing) + 2;

    this.init(startZ).catch((e) =>
      console.error("[SideObjectsInstanced] init error", e),
    );
  }

  private async init(startZ: number) {
    // создаём один куб через CubeBuilder
    const cube = await CubeBuilder.build({
      useGLB: true,
      geomConfig: SIDE_OBJECT_GEOMETRY_CONFIG,
      useTexture: true,
      materialConfig: SIDE_OBJECT_MATERIAL_CONFIG,
    });

    // ищем Mesh внутри
    let sourceMesh: THREE.Mesh | undefined;

    cube.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        sourceMesh = child as THREE.Mesh;
      }
    });

    if (!sourceMesh) {
      throw new Error("No mesh found inside GLB cube");
    }

    const geometry = sourceMesh.geometry;
    const material = sourceMesh.material;

    this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.scene.add(this.mesh);
    const scale = new THREE.Vector3(...SIDE_OBJECT_GEOMETRY_CONFIG.scale);

    for (let i = 0; i < this.count; i++) {
      const z = startZ - i * this.spacing;

      const pos = new THREE.Vector3(this.x, 0.15, z);
      this.positions.push(pos);

      this.dummy.position.copy(pos);

      // применяем scale из GLB
      this.dummy.scale.copy(scale);

      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  update(delta: number, speed: number) {
    if (!this.mesh) return;

    const move = delta * speed;

    for (let i = 0; i < this.count; i++) {
      const pos = this.positions[i];
      if (!pos) continue;

      pos.z += move;

      if (pos.z > 10) {
        pos.z -= this.count * this.spacing;
      }

      this.dummy.position.copy(pos);
      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    if (!this.mesh) return;

    this.scene.remove(this.mesh);

    this.mesh.geometry.dispose();

    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((m) => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}
