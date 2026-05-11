import { useCommonStore } from "@/store/commonStore";
import * as THREE from "three";

export class Bullet extends THREE.Mesh {
  protected lane: number;
  protected speed = useCommonStore().BULLET_DEFAULT_SPEED;
  protected collider = new THREE.Box3();

  constructor(lane: number) {
    const geo = new THREE.BoxGeometry(...useCommonStore().getBulletGeometry());

    const mat = new THREE.MeshStandardMaterial(
      useCommonStore().BULLET_DEFAULT_MATERIAL,
    );

    super(geo, mat);
    this.lane = lane;
  }

  update(dt: number) {
    const dz = dt * this.speed;
    this.position.z -= dz;
    this.collider.setFromObject(this);
  }

  public getLane() {
    return this.lane;
  }
}
