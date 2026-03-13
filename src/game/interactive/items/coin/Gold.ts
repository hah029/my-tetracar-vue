// src/game/coin/Coin.ts

import { CoinItem } from "./CoinItem";
import { COIN_MATERIAL_CONFIG } from "./config";

export class GoldCoin extends CoinItem {
  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 10,
  ) {
    super(laneIndex, zPos, yPos, COIN_MATERIAL_CONFIG);
    this.value = value;
    this.itemType = "gold";
  }
}
