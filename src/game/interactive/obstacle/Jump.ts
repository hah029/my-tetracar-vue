// src/game/Jump.ts
import * as THREE from "three";
import { RoadManager } from "@/game/environment/road";
import { useCommonStore } from "@/store/commonStore";

export interface JumpConfig {
  lane: number;
  materialIndex: number;
  activated: boolean;
  isJump: boolean;
}

export class Jump extends THREE.Mesh {
  private collider: THREE.Box3;

  constructor(
    laneIndex: number,
    scene: THREE.Scene,
    zPos: number = useCommonStore().BASE_SEGMENTS_ZPOS,
  ) {
    const commonStore = useCommonStore();

    // create rotated box
    const geometry = new THREE.BoxGeometry(
      commonStore.JUMP_WIDTH,
      commonStore.JUMP_HEIGHT,
      commonStore.JUMP_DEPTH,
    );
    geometry.rotateX(Math.PI / 12);

    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.85,
    });
    super(geometry, material.clone());

    // Позиция по полосе через RoadManager
    const x = RoadManager.getInstance().getLanePosition(laneIndex);
    this.position.set(x, commonStore.BASE_ITEM_YPOS, zPos);

    this.collider = new THREE.Box3().setFromObject(this);
    scene.add(this);
  }

  // Движение трамплина и анимация свечения
  public update(deltaTime: number, speed: number): boolean {
    this.position.z += deltaTime * speed;
    this.collider.setFromObject(this);
    return this.position.z > useCommonStore().ITEMS_REMOVING_ZPOS;
  }

  public getBoundingBox(): THREE.Box3 {
    return this.collider.clone();
  }
}
