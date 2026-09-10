import * as THREE from "three";
import { useCommonStore } from "@/store/commonStore";
import type { RoadLampPostsConfig } from "./types";

/**
 * Repeating decorative lamps. The pole and arm are emissive, so they remain
 * visibly neon and contribute to bloom even away from real spotlights.
 * Ground illumination is faked with an instanced additive plane. A tiny pool
 * of real spotlights follows the nearest lamps for local illumination.
 */
export class LampPostsInstanced {
  private readonly group = new THREE.Group();
  private readonly positions: THREE.Vector3[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly post: THREE.InstancedMesh;
  private readonly arm: THREE.InstancedMesh;
  private readonly groundGlow: THREE.InstancedMesh;
  private readonly spotLights: THREE.SpotLight[] = [];
  private readonly spotLightTargets: THREE.Object3D[] = [];
  private readonly count: number;

  /**
   * A radial alpha texture turns a flat plane into a feathered light pool.
   * It is deliberately generated once and shared by every lamp instance.
   */
  private createGroundGlowTexture(): THREE.DataTexture {
    const size = 64;
    const pixels = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x / (size - 1)) * 2 - 1;
        const v = (y / (size - 1)) * 2 - 1;
        const distance = Math.sqrt(u * u + v * v);
        const alpha = distance < 1 ? Math.pow(1 - distance, 2.1) : 0;
        const index = (y * size + x) * 4;
        pixels[index] = 255;
        pixels[index + 1] = 255;
        pixels[index + 2] = 255;
        pixels[index + 3] = Math.round(alpha * 255);
      }
    }

    const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  constructor(
    private readonly scene: THREE.Scene,
    private readonly x: number,
    startZ: number,
    endZ: number,
    private readonly config: RoadLampPostsConfig,
    private readonly armDirection: -1 | 1,
  ) {
    this.count = Math.ceil((endZ - startZ) / config.spacing) + 2;
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: config.emissiveIntensity ?? 5,
      metalness: 0.15,
      roughness: 0.48,
      transparent: config.opacity < 1,
      opacity: config.opacity,
      // Avoid a translucent post hiding the glow of lamps behind it.
      depthWrite: false,
      // Preserve the HDR emissive value for the bloom pass.
      toneMapped: false,
    });
    this.post = new THREE.InstancedMesh(
      new THREE.BoxGeometry(config.thickness, config.height, config.thickness),
      material,
      this.count,
    );
    this.arm = new THREE.InstancedMesh(
      new THREE.BoxGeometry(
        config.armLength,
        config.thickness,
        config.thickness,
      ),
      material.clone(),
      this.count,
    );
    this.groundGlow = new THREE.InstancedMesh(
      new THREE.CircleGeometry(1, 32),
      new THREE.MeshBasicMaterial({
        color: config.color,
        map: this.createGroundGlowTexture(),
        transparent: true,
        opacity: Math.min(0.13, config.opacity * 0.22),
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
    this.createSpotLightPool();
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
        position.x + (armX * this.config.armLength) / 2,
        this.config.height + (armY * this.config.armLength) / 2,
        position.z,
      );
      this.dummy.rotation.set(0, 0, armRotation);
      this.dummy.updateMatrix();
      this.arm.setMatrixAt(i, this.dummy.matrix);

      // A feathered ellipse gives the road a broad, faint pool of light.
      // It is stretched across the road, as light spills inward from the
      // roadside lamp instead of forming a circular decal under it.
      this.dummy.position.set(
        position.x + this.armDirection * this.config.armLength,
        0.015,
        position.z,
      );
      this.dummy.rotation.set(-Math.PI / 2, 0, 0);
      this.dummy.scale.set(
        Math.max(2.6, this.config.armLength * 1.25),
        Math.max(2.6, this.config.armLength * 2),
        1,
      );
      this.dummy.updateMatrix();
      this.groundGlow.setMatrixAt(i, this.dummy.matrix);
    }
    this.post.instanceMatrix.needsUpdate = true;
    this.arm.instanceMatrix.needsUpdate = true;
    this.groundGlow.instanceMatrix.needsUpdate = true;
    this.updateSpotLightPool(armX, armY);
  }

  /**
   * Lights cannot be instanced. We therefore create a fixed-size pool and
   * reuse it for the closest decorative lamps instead of lighting the whole
   * road with every visible post.
   */
  private createSpotLightPool(): void {
    const count = Math.max(0, Math.floor(this.config.realLightCount ?? 2));
    const color = new THREE.Color(this.config.color);

    for (let i = 0; i < count; i++) {
      const light = new THREE.SpotLight(
        color,
        this.config.realLightIntensity ?? 7,
        this.config.realLightDistance ?? 34,
        this.config.realLightAngle ?? 0.72,
        this.config.realLightPenumbra ?? 0.9,
        2,
      );
      light.castShadow = false;
      light.visible = false;

      const target = new THREE.Object3D();
      light.target = target;
      this.spotLights.push(light);
      this.spotLightTargets.push(target);
      this.group.add(light, target);
    }
  }

  private updateSpotLightPool(armX: number, armY: number): void {
    if (this.spotLights.length === 0) return;

    const closest = [...this.positions]
      .sort((a, b) => Math.abs(a.z) - Math.abs(b.z))
      .slice(0, this.spotLights.length);

    for (let i = 0; i < this.spotLights.length; i++) {
      const light = this.spotLights[i]!;
      const target = this.spotLightTargets[i]!;
      const postPosition = closest[i];

      if (!postPosition) {
        light.visible = false;
        continue;
      }

      const headX = postPosition.x + armX * this.config.armLength;
      const headY = this.config.height + armY * this.config.armLength;
      light.position.set(headX, headY, postPosition.z);
      target.position.set(
        headX + this.armDirection * this.config.armLength * 0.65,
        0.02,
        postPosition.z,
      );
      target.updateMatrixWorld();
      light.visible = true;
    }
  }

  public dispose(): void {
    this.scene.remove(this.group);
    this.post.geometry.dispose();
    this.arm.geometry.dispose();
    this.groundGlow.geometry.dispose();
    (this.post.material as THREE.Material).dispose();
    (this.arm.material as THREE.Material).dispose();
    const groundGlowMaterial = this.groundGlow
      .material as THREE.MeshBasicMaterial;
    groundGlowMaterial.map?.dispose();
    groundGlowMaterial.dispose();
    for (const light of this.spotLights) light.dispose();
  }
}
