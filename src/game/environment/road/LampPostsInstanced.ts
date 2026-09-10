import * as THREE from "three";
import { useCommonStore } from "@/store/commonStore";
import type { RoadLampPostsConfig } from "./types";

/**
 * Repeating decorative lamps. Both parts use an unlit material deliberately:
 * their colour remains neon even on levels with no suitable scene lighting.
 * Ground illumination is faked with an instanced additive plane. Real lights
 * are deliberately avoided here: every SpotLight enlarges the lighting shader
 * loop for all lit objects in the scene.
 */
export class LampPostsInstanced {
  private readonly group = new THREE.Group();
  private readonly positions: THREE.Vector3[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly post: THREE.InstancedMesh;
  private readonly arm: THREE.InstancedMesh;
  private readonly groundGlow: THREE.InstancedMesh;
  private readonly count: number;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly x: number,
    startZ: number,
    endZ: number,
    private readonly config: RoadLampPostsConfig,
    private readonly armDirection: -1 | 1,
  ) {
    this.count = Math.ceil((endZ - startZ) / config.spacing) + 2;
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: config.opacity < 1,
      opacity: config.opacity,
      // Avoid a translucent post hiding the glow of lamps behind it.
      depthWrite: false,
    });
    this.post = new THREE.InstancedMesh(
      new THREE.BoxGeometry(config.thickness, config.height, config.thickness),
      material,
      this.count,
    );
    this.arm = new THREE.InstancedMesh(
      new THREE.BoxGeometry(config.armLength, config.thickness, config.thickness),
      material.clone(),
      this.count,
    );
    this.groundGlow = new THREE.InstancedMesh(
      new THREE.CircleGeometry(Math.max(2.5, config.armLength * 0.45), 16),
      new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: Math.min(0.22, config.opacity * 0.4),
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
      this.count,
    );
    this.groundGlow.frustumCulled = false;
    this.group.add(this.post, this.arm, this.groundGlow);
    this.scene.add(this.group);

    for (let i = 0; i < this.count; i++) {
      this.positions.push(new THREE.Vector3(x, 0, startZ - i * config.spacing));
    }
    this.updateInstances();
  }

  public update(delta: number, speed: number): void {
    const move = delta * speed;
    const removeZ = useCommonStore().config.itemsRemovingZpos;
    for (const position of this.positions) {
      position.z += move;
      if (position.z > removeZ) position.z -= this.count * this.config.spacing;
    }
    this.updateInstances();
  }

  private updateInstances(): void {
    // 125° from the upright pole means the arm slopes 35° down from horizontal.
    const armSlope = THREE.MathUtils.degToRad(this.config.armAngleDeg - 90);
    const armX = this.armDirection * Math.cos(armSlope);
    const armY = -Math.sin(armSlope);
    const armRotation = Math.atan2(armY, armX);

    for (let i = 0; i < this.count; i++) {
      const position = this.positions[i]!;
      this.dummy.position.set(position.x, this.config.height / 2, position.z);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.post.setMatrixAt(i, this.dummy.matrix);

      this.dummy.position.set(
        position.x + armX * this.config.armLength / 2,
        this.config.height + armY * this.config.armLength / 2,
        position.z,
      );
      this.dummy.rotation.set(0, 0, armRotation);
      this.dummy.updateMatrix();
      this.arm.setMatrixAt(i, this.dummy.matrix);

      // A horizontal, additive disk gives the road a light pool without a
      // SpotLight's scene-wide shader cost.
      this.dummy.position.set(
        position.x + this.armDirection * this.config.armLength,
        0.015,
        position.z,
      );
      this.dummy.rotation.set(-Math.PI / 2, 0, 0);
      this.dummy.updateMatrix();
      this.groundGlow.setMatrixAt(i, this.dummy.matrix);
    }
    this.post.instanceMatrix.needsUpdate = true;
    this.arm.instanceMatrix.needsUpdate = true;
    this.groundGlow.instanceMatrix.needsUpdate = true;
  }

  public dispose(): void {
    this.scene.remove(this.group);
    this.post.geometry.dispose();
    this.arm.geometry.dispose();
    this.groundGlow.geometry.dispose();
    (this.post.material as THREE.Material).dispose();
    (this.arm.material as THREE.Material).dispose();
    (this.groundGlow.material as THREE.Material).dispose();
  }
}
