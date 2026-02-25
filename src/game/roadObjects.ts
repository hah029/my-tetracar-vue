import * as THREE from "three";

export const sideObjects: THREE.Mesh[] = [];
let scene: THREE.Scene;

export function setScene(s: THREE.Scene) {
  scene = s;
}

export function createSideObjects() {
  if (!scene) throw new Error("Scene not set for side objects");

  const roadLength = 200;
  const spacing = 7;
  const laneOffset = 6;

  for (let z = -roadLength; z <= 10; z += spacing) {
    for (const side of [-1, 1]) {
      const geo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
      const obj = new THREE.Mesh(geo, mat);
      obj.position.set(laneOffset * side, 0.25, z);
      scene.add(obj);
      sideObjects.push(obj);
    }
  }
}

export function updateSideObjects(speed: number) {
  sideObjects.forEach(obj => {
    obj.position.z += speed;
    if (obj.position.z > 10) obj.position.z -= 210;
  });
}