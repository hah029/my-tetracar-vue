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
  private laneIndex: number;

  constructor(
    laneIndex: number,
    scene: THREE.Scene,
    zPos: number = useCommonStore().config.baseSegmentsZpos,
  ) {
    const commonStore = useCommonStore();

    // create rotated box
    const geometry = new THREE.BoxGeometry(
      commonStore.config.jumpWidth,
      commonStore.config.jumpHeight,
      commonStore.config.jumpDepth,
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
    this.laneIndex = laneIndex;

    // Позиция по полосе через RoadManager
    const road = RoadManager.getInstance();
    const x = road.getLanePosition(laneIndex);
    this.position.set(
      x,
      commonStore.baseItemYpos + road.getSurfaceHeightAt(laneIndex, zPos),
      zPos,
    );
    this.userData.previousZ = zPos;

    this.collider = new THREE.Box3().setFromObject(this);
    scene.add(this);
  }

  // Движение трамплина и анимация свечения
  public update(deltaTime: number, speed: number): boolean {
    this.userData.previousZ = this.position.z;
    this.position.z += deltaTime * speed;
    this.position.y =
      useCommonStore().baseItemYpos +
      RoadManager.getInstance().getSurfaceHeightAt(
        this.laneIndex,
        this.position.z,
      );
    this.collider.setFromObject(this);
    return this.position.z > useCommonStore().config.itemsRemovingZpos;
  }

  public getBoundingBox(): THREE.Box3 {
    return this.collider.clone();
  }
}
