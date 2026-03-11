import * as THREE from "three";
import { loadGLB } from "@/helpers/loaders/loadGLB";

export class GLBInstancedBuildings {
  private mesh!: THREE.InstancedMesh;
  // public ready: Promise<void>;

  private positions: THREE.Vector3[] = [];
  private scales: number[] = [];

  private dummy = new THREE.Object3D();

  private count: number;
  private scene: THREE.Scene;
  private spacing: number = 10; // default, можно задавать при создании

  constructor(
    scene: THREE.Scene,
    // glbUrl: string,
    count: number,
    spacing?: number,
  ) {
    this.scene = scene;
    this.count = count;
    if (spacing) this.spacing = spacing;

    // this.init(glbUrl);
    this.init();
  }

  // private init(url: string) {
  private init() {
    // const model = await loadGLB(url);

    // let sourceMesh: THREE.Mesh | null = null;

    // model.traverse((child) => {
    //   if ((child as THREE.Mesh).isMesh) {
    //     sourceMesh = child as THREE.Mesh;
    //   }
    // });

    // if (!sourceMesh) {
    //   throw new Error("GLB has no mesh");
    // }

    const geometry = new THREE.BoxGeometry(10, 10, 10);
    // const geometry = sourceMesh.geometry;
    const material = new THREE.MeshBasicMaterial({ color: 0x888888 });

    this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;

    this.scene.add(this.mesh);
  }

  setInstance(index: number, x: number, y: number, z: number, scale: number) {
    if (!this.mesh) return;

    this.positions[index] = new THREE.Vector3(x, y, z);
    this.scales[index] = scale;

    console.log(
      `[GLBInstancedBuildings] setInstance ${index}: (${x}, ${y}, ${z}), scale ${scale}`,
    );
    this.updateMatrixAt(index);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private updateMatrixAt(index: number) {
    const pos = this.positions[index];
    // const scale = this.scales[index];

    this.dummy.position.copy(pos!);
    this.dummy.scale.copy(new THREE.Vector3(0.001, 0.001, 0.001));
    // this.dummy.scale.set(0.01, 0.01, 0.01);
    // this.dummy.scale.set(scale, scale, scale);
    this.dummy.updateMatrix();

    this.mesh.setMatrixAt(index, this.dummy.matrix);
  }

  update(dt: number, speed: number, zStart: number, zEnd: number) {
    if (!this.mesh) return;

    const move = dt * speed;

    for (let i = 0; i < this.positions.length; i++) {
      const pos = this.positions[i];
      if (!pos) continue;

      // const oldZ = pos.z;

      pos.z += move;

      // console.log(`[GLBInstancedBuildings] update: i=${i}, pos.z=${pos.z}`);
      if (i == 0) console.log(pos);
      // Respawn: если ушло за zStart (слишком далеко назад), переносим в конец zEnd
      if (pos.z > zEnd) {
        // console.log(
        //   `[GLBInstancedBuildings] respawn instance ${i}: oldZ=${oldZ} < zStart=${zStart}, newZ=${zEnd - this.spacing}`,
        // );
        pos.z = zStart; // строго за пределами zEnd
      }

      this.updateMatrixAt(i);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public getMeshSize() {
    if (!this.mesh.geometry) return new THREE.Vector3(); // если геометрии нет
    this.mesh.geometry.computeBoundingBox(); // вычисляем bounding box
    const size = new THREE.Vector3();
    this.mesh.geometry.boundingBox!.getSize(size); // используем boundingBox геометрии
    return size;
  }
}
