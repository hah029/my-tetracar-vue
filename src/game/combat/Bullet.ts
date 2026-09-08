import { useCommonStore } from "@/store/commonStore";
import * as THREE from "three";
import type { BulletVariant } from "./BulletVariant";
import { BOOST_SPECIAL_MODES } from "@/configs/meta";

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
      ? new THREE.BoxGeometry(geometry[0], geometry[1], BOOST_SPECIAL_MODES.bullet.railgun.length)
      : new THREE.BoxGeometry(...geometry);

    const mat = new THREE.MeshStandardMaterial({
      ...useCommonStore().config.bulletDefaultMaterial,
    });

    super(geo, mat);
    this.lane = lane;
    this.variant = variant;
    this.speed = speed ?? this.speed;
    this.remainingHits = variant === "piercing" ? BOOST_SPECIAL_MODES.bullet.piercing.maxHits : variant === "railgun" ? Number.POSITIVE_INFINITY : 1;
  }

  update(dt: number) {
    if (this.variant !== "normal") {
      const material = this.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 20 + Math.sin(performance.now() * 0.025) * 7;
    }
    if (this.variant === "railgun") return;
    const dz = dt * this.speed;
    this.position.z -= dz;
    this.position.x += dt * this.lateralSpeed;
    this.collider.setFromObject(this);
  }

  public getLane() {
    return this.lane;
  }
}
