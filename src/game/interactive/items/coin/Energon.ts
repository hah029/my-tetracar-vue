// src/game/interactive/items/coin/Energon.ts

import * as THREE from "three";
import { CoinItem } from "./CoinItem";
import { useCommonStore } from "@/store/commonStore";
import type { MaterialConfig } from "@/game/cube/types";

export class Energon extends CoinItem {
  private static readonly outerGeometry = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(2, 1, 2),
  );
  private static readonly innerGeometry = new THREE.BoxGeometry(2, 1, 2);
  private static readonly outerMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color().setRGB(2.4, 2.4, 2.4),
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    toneMapped: false,
  });
  private static readonly innerMaterial = new THREE.MeshStandardMaterial({
    color: 0x009cfe,
    emissive: new THREE.Color().setHex(0x00abe9),
    emissiveIntensity: 10,
    toneMapped: false,
    roughness: 0.35,
    metalness: 0,
  });

  constructor(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
    value: number = useCommonStore().config.baseCoinValue,
  ) {
    super(zPos, laneIndex, xPos, yPos);
    this.value = value;
  }

  /**
   * Энергон состоит из неонового каркаса и меньшего светящегося ядра.
   * Материалы и геометрия общие для всех экземпляров, поэтому новая
   * визуализация не дублирует ресурсы на каждый предмет.
   */
  override async build(_material: MaterialConfig | null = null): Promise<void> {
    const { scale } = useCommonStore().itemGeometryConfig;
    const outerScale = new THREE.Vector3(...scale);
    const innerScale = outerScale.clone().multiplyScalar(0.6);

    // console.debug("[Energon] visual cube dimensions", {
    //   outer: outerScale.toArray(),
    //   inner: innerScale.toArray(),
    // });

    const visual = new THREE.Group();

    const outerFrame = new THREE.LineSegments(
      Energon.outerGeometry,
      Energon.outerMaterial,
    );
    outerFrame.scale.copy(outerScale);
    outerFrame.renderOrder = 1;

    const innerCube = new THREE.Mesh(
      Energon.innerGeometry,
      Energon.innerMaterial,
    );
    innerCube.scale.copy(innerScale);

    visual.add(innerCube, outerFrame);
    this.cube = visual;
    this.add(visual);
  }
}
