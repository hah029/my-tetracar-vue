import * as THREE from "three";

export class Bullet extends THREE.Mesh {
  lane: number;
  speed = 0.15;

  collider = new THREE.Box3();

  constructor(lane: number) {
    const geo = new THREE.BoxGeometry(1, 1, 1);

    const mat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 5,
    });

    super(geo, mat);

    this.lane = lane;
  }

  update(dt: number) {
    const dz = dt * this.speed;

    this.position.z -= dz;

    // обновляем collider
    this.collider.setFromObject(this);
  }
}
