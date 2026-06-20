import { useCommonStore } from "@/store/commonStore";
import * as THREE from "three";

export class Bullet extends THREE.Mesh {
  protected lane: number;
  protected speed = useCommonStore().config.bulletDefaultSpeed;
  protected collider = new THREE.Box3();

  constructor(lane: number) {
    const geo = new THREE.BoxGeometry(...useCommonStore().getBulletGeometry());

    const mat = new THREE.MeshStandardMaterial(
      useCommonStore().config.bulletDefaultMaterial,
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
