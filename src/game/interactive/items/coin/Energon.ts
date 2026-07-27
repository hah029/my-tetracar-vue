// src/game/interactive/items/coin/Energon.ts

import { CoinItem } from "./CoinItem";
import { useCommonStore } from "@/store/commonStore";
import { MaterialPool } from "@/helpers/MaterialPool";

export class Energon extends CoinItem {
  constructor(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
    value: number = useCommonStore().config.baseCoinValue,
  ) {
    // Передаём готовый материал из пула
    super(zPos, laneIndex, xPos, yPos, null, MaterialPool.getEnergonMaterial());
    this.value = value;
  }
}
