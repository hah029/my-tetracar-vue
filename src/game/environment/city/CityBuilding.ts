import { loadTexture } from "@/helpers/loaders";
import buildingTexture from "@/assets/textures/building.jpg";

import * as THREE from "three";

export class CityBuilding extends THREE.Mesh {
  constructor(width: number, height: number, depth: number) {
    const geometry = new THREE.BoxGeometry(width, height, depth);

    const texture = loadTexture(buildingTexture);

    const material = new THREE.MeshStandardMaterial({ map: texture });
    super(geometry, material);
    this.castShadow = true;
    this.receiveShadow = true;
  }
}
