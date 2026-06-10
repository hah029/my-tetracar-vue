// src/game/interactive/items/coin/Golden.ts

import { useCommonStore } from "@/store/commonStore";
import { CoinItem } from "./CoinItem";
import { MaterialPool } from "@/helpers/MaterialPool"; 

export class Golden extends CoinItem {
  constructor(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
    value: number = useCommonStore().BASE_COIN_VALUE,
  ) {
    // Передаём готовый материал из пула
    super(zPos, laneIndex, xPos, yPos, null, MaterialPool.getGoldenMaterial());
    this.value = value;
  }
}