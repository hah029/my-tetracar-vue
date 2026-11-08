// src/game/interactive/items/coin/Golden.ts

import * as THREE from "three";
import { useCommonStore } from "@/store/commonStore";
import { CoinItem } from "./CoinItem";
import { MaterialPool } from "@/helpers/MaterialPool";
import type { MaterialConfig } from "@/game/cube/types";

export class Golden extends CoinItem {
  constructor(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
    value: number = useCommonStore().config.baseCoinValue,
  ) {
    // Передаём готовый материал из пула
    super(zPos, laneIndex, xPos, yPos, null, MaterialPool.getGoldenMaterial());
    this.value = value;
  }

  override async build(material: MaterialConfig | null = null): Promise<void> {
    await super.build(material);

    // this.cube.updateWorldMatrix(true, true);
    // const size = new THREE.Box3().setFromObject(this.cube).getSize(
    //   new THREE.Vector3(),
    // );

    // console.debug("[Golden] actual visual dimensions", {
    //   outer: size.toArray(),
    // });
  }
}
