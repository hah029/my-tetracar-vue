import * as THREE from "three";
import { useCommonStore } from "@/store/commonStore";
import type { RoadLampPostsConfig } from "./types";

/**
 * Repeating decorative lamps. Both parts use an unlit material deliberately:
 * their colour remains neon even on levels with no suitable scene lighting.
 */
export class LampPostsInstanced {
  private readonly group = new THREE.Group();
  private readonly positions: THREE.Vector3[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly post: THREE.InstancedMesh;
  private readonly arm: THREE.InstancedMesh;
  private readonly lights: THREE.SpotLight[] = [];
  private readonly lightTargets: THREE.Object3D[] = [];
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
    this.group.add(this.post, this.arm);
    this.scene.add(this.group);

    for (let i = 0; i < this.count; i++) {
      this.positions.push(new THREE.Vector3(x, 0, startZ - i * config.spacing));
      const light = new THREE.SpotLight(
        config.color,
        14,
        Math.max(20, config.height * 2.2),
        Math.PI / 5,
        0.65,
        1.4,
      );
      // Decorative lights should remain cheap even when a level uses many lamps.
      light.castShadow = false;
      const target = new THREE.Object3D();
      this.group.add(light, target);
      light.target = target;
      this.lights.push(light);
      this.lightTargets.push(target);
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

      const light = this.lights[i];
      const target = this.lightTargets[i];
      if (light && target) {
        light.position.set(position.x, this.config.height, position.z);
        // Aim slightly inward, following the arm, then down to the road.
        target.position.set(
          position.x + this.armDirection * this.config.armLength,
          0,
          position.z,
        );
      }
    }
    this.post.instanceMatrix.needsUpdate = true;
    this.arm.instanceMatrix.needsUpdate = true;
  }

  public dispose(): void {
    this.scene.remove(this.group);
    this.post.geometry.dispose();
    this.arm.geometry.dispose();
    (this.post.material as THREE.Material).dispose();
    (this.arm.material as THREE.Material).dispose();
    this.lights.length = 0;
    this.lightTargets.length = 0;
  }
}
