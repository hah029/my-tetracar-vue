// /game/road/SideObjectsInstanced.ts

import * as THREE from "three";

import { loadCubeModel } from "../cube/loadCube";

import { useCommonStore } from "@/store/commonStore";

import { useEnvironmentStore } from "@/store/environmentStore";

import { atlas } from "@/assets/textures/TextureAtlas";

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
    //
    // GEOMETRY
    //

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    //
    // APPLY ATLAS UV
    //

    const sprite = atlas.getSprite("cube_base");

    if (!sprite) {
      throw new Error("Atlas sprite not found");
    }

    const uv = geometry.attributes.uv;

    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i);

      const v = uv.getY(i);

      uv.setXY(
        i,

        sprite.uvRect.u + u * sprite.uvRect.w,

        sprite.uvRect.v + v * sprite.uvRect.h,
      );
    }

    uv.needsUpdate = true;

    //
    // TEXTURE
    //

    const atlasTexture = atlas.getAtlasTexture();

    if (!atlasTexture) {
      throw new Error("Atlas texture not loaded");
    }

    atlasTexture.flipY = false;

    atlasTexture.colorSpace = THREE.SRGBColorSpace;

    //
    // MATERIAL
    //

    const material = new THREE.MeshStandardMaterial({
      map: atlasTexture,
      color: 0xffffff,
    });

    //
    // INSTANCED MESH
    //

    this.mesh = new THREE.InstancedMesh(geometry, material, this.count);

    this.mesh.castShadow = true;

    this.mesh.receiveShadow = true;

    this.scene.add(this.mesh);

    //
    // SCALE
    //

    const scale = new THREE.Vector3(
      // ...useEnvironmentStore().SIDE_OBJECT_GEOMETRY_CONFIG.scale,
      1.75,
      1.4,
      1.75,
    );

    //
    // CREATE INSTANCES
    //

    for (let i = 0; i < this.count; i++) {
      const z = startZ - i * this.spacing;

      const pos = new THREE.Vector3(this.x, 0.4, z);

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

      if (pos.z > useCommonStore().ITEMS_REMOVING_ZPOS) {
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
