// src/game/coin/Coin.ts
import { CoinItem } from "./CoinItem";
import { DIAMOND_MATERIAL_CONFIG } from "./config";

export class DiamondCoin extends CoinItem {
  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 1,
  ) {
    super(laneIndex, zPos, yPos, DIAMOND_MATERIAL_CONFIG);
    this.value = value;
    this.itemType = "diamond";
  }
}
