import * as THREE from "three";
import { useCommonStore } from "@/store/commonStore";
import { atlas } from "@/assets/textures/TextureAtlas";
import { ATLAS_SPRITES } from "@/assets/textures/atlasSprites";
import { applyCubeSpriteUV } from "@/helpers/applyAtlasUV";
import type { RoadSideObjectsConfig } from "./types";
// /game/road/SideObjectsInstanced.ts
// import { loadCubeModel } from "@/game/cube/loadCube";

export class SideObjectsInstanced {
  private mesh!: THREE.InstancedMesh;
  private positions: THREE.Vector3[] = [];
  private dummy = new THREE.Object3D();
  private spacing: number;
  private count: number;
  private scene: THREE.Scene;
  private x: number;
  private config: RoadSideObjectsConfig;
  private disposed = false;

  constructor(
    scene: THREE.Scene,
    x: number,
    startZ: number,
    endZ: number,
    config: RoadSideObjectsConfig,
  ) {
    this.scene = scene;
    this.x = x;
    this.config = config;
    this.spacing = config.spacing;
    this.count = Math.ceil((endZ - startZ) / this.spacing) + 2;
    this.init(startZ).catch((e) =>
      console.error("[SideObjectsInstanced] init error", e),
    );
  }

  private async init(startZ: number) {
    if (this.disposed) return;

    // GEOMETRY
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // APPLY ATLAS UV
    const sprite = atlas.getSprite(ATLAS_SPRITES.cube.base);
    if (!sprite) throw new Error("Atlas sprite not found");
    applyCubeSpriteUV(geometry, sprite);

    // TEXTURE
    const atlasTexture = atlas.getAtlasTexture();
    if (!atlasTexture) throw new Error("Atlas texture not loaded");
    atlasTexture.flipY = false;
    atlasTexture.colorSpace = THREE.SRGBColorSpace;

    // MATERIAL
    const material = new THREE.MeshStandardMaterial({
      map: atlasTexture,
      color: this.config.color,
      emissive: this.config.emissive ?? 0x000000,
      emissiveIntensity: this.config.emissiveIntensity ?? 0,
      transparent: (this.config.opacity ?? 1) < 1,
      opacity: this.config.opacity ?? 1,
    });

    if (this.disposed) {
      geometry.dispose();
      material.dispose();
      return;
    }

    // INSTANCED MESH
    this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    // SCALE
    const scale = new THREE.Vector3(...this.config.scale);

    // CREATE INSTANCES
    for (let i = 0; i < this.count; i++) {
      const z = startZ - i * this.spacing;
      const pos = new THREE.Vector3(this.x, this.config.y, z);
      this.positions.push(pos);
      this.dummy.position.copy(pos);
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

      if (pos.z > useCommonStore().config.itemsRemovingZpos) {
        pos.z -= this.count * this.spacing;
      }

      this.dummy.position.copy(pos);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.disposed = true;
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
