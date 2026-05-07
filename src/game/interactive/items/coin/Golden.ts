// src/game/coin/Coin.ts

import { useCommonStore } from "@/store/commonStore";
import { CoinItem } from "./CoinItem";
import { GOLDEN_MATERIAL_CONFIG } from "./config";

export class Golden extends CoinItem {
  constructor(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
    value: number = useCommonStore().BASE_COIN_VALUE,
  ) {
    super(zPos, laneIndex, xPos, yPos, { ...GOLDEN_MATERIAL_CONFIG });
    this.value = value;
  }
}
