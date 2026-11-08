import { useCommonStore } from "@/store/commonStore";
import * as THREE from "three";
import type { BulletVariant } from "./BulletVariant";
import { BOOST_SPECIAL_MODES } from "@/configs/meta";
import railgunVertexShader from "@/game/shaders/railgun/vertex.glsl";
import railgunFragmentShader from "@/game/shaders/railgun/fragment.glsl";
import { CameraSystem } from "@/game/camera/CameraSystem";

export class Bullet extends THREE.Mesh {
  protected lane: number;
  protected speed = useCommonStore().config.bulletDefaultSpeed;
  protected collider = new THREE.Box3();
  public readonly variant: BulletVariant;
  public remainingHits: number;
  public readonly hitObstacles = new Set<unknown>();
  public readonly createdAt = performance.now();

  constructor(
    lane: number,
    variant: BulletVariant = "normal",
    speed?: number,
    private readonly lateralSpeed = 0,
  ) {
    const geometry = useCommonStore().getBulletGeometry();
    const railgunWidth = geometry[0] * 16;
    const railgunHeight = geometry[1] * 3.2;
    const railgunLength = BOOST_SPECIAL_MODES.bullet.railgun.length;
    const geo = variant === "railgun"
      ? new THREE.BoxGeometry(
        railgunWidth,
        railgunHeight,
        railgunLength,
      )
      : new THREE.BoxGeometry(...geometry);

    const mat = variant === "railgun"
      ? new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uLife: { value: 0 },
          uColor: { value: new THREE.Color("#ff3028") },
          uCameraLocalPosition: { value: new THREE.Vector3() },
          uBounds: {
            value: new THREE.Vector3(
              railgunWidth / 2,
              railgunHeight / 2,
              railgunLength / 2,
            ),
          },
        },
        side: THREE.FrontSide,
        vertexShader: railgunVertexShader,
        fragmentShader: railgunFragmentShader,
        toneMapped: false,
      })
      : new THREE.MeshStandardMaterial({
        ...useCommonStore().config.bulletDefaultMaterial,
      });

    super(geo, mat);
    this.lane = lane;
    this.variant = variant;
    this.speed = speed ?? this.speed;
    this.remainingHits = variant === "piercing" ? BOOST_SPECIAL_MODES.bullet.piercing.maxHits : variant === "railgun" ? Number.POSITIVE_INFINITY : 1;

    if (variant === "railgun") {
      this.frustumCulled = false;
      this.renderOrder = 12;
    }
  }

  update(dt: number) {
    if (this.variant === "railgun") {
      const material = this.material as THREE.ShaderMaterial;
      const elapsed = performance.now() - this.createdAt;
      material.uniforms.uTime.value = elapsed / 1000;
      material.uniforms.uLife.value = Math.min(
        elapsed / BOOST_SPECIAL_MODES.bullet.railgun.lifetimeMs,
        1,
      );
      const camera = CameraSystem.getCamera();
      if (camera) {
        material.uniforms.uCameraLocalPosition.value
          .copy(camera.position)
          .sub(this.position);
      }
      return;
    }

    if (this.variant !== "normal") {
      const material = this.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 20 + Math.sin(performance.now() * 0.025) * 7;
    }
    const dz = dt * this.speed;
    this.position.z -= dz;
    this.position.x += dt * this.lateralSpeed;
    this.collider.setFromObject(this);
  }

  public getLane() {
    return this.lane;
  }

  public setCollisionBox(target: THREE.Box3) {
    if (this.variant !== "railgun") {
      return target.setFromObject(this);
    }

    const [width, height] = useCommonStore().getBulletGeometry();
    return target.setFromCenterAndSize(
      this.position,
      new THREE.Vector3(
        width,
        height,
        BOOST_SPECIAL_MODES.bullet.railgun.length,
      ),
    );
  }
}
