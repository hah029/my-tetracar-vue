import { useCommonStore } from "@/store/commonStore";
import * as THREE from "three";
import type { BulletVariant } from "./BulletVariant";
import { BOOST_SPECIAL_MODES } from "@/configs/meta";
import railgunVertexShader from "@/game/shaders/railgun/vertex.glsl";
import railgunFragmentShader from "@/game/shaders/railgun/fragment.glsl";

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
    const geo = variant === "railgun"
      ? new THREE.PlaneGeometry(
        geometry[0] * 16,
        BOOST_SPECIAL_MODES.bullet.railgun.length,
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
        },
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
      this.rotation.x = -Math.PI / 2;
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
