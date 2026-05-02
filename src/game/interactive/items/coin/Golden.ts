// src/game/coin/Coin.ts

import { CoinItem } from "./CoinItem";
import { GOLDEN_MATERIAL_CONFIG } from "./config";

export class Golden extends CoinItem {
  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 10,
  ) {
    super(laneIndex, zPos, yPos, { ...GOLDEN_MATERIAL_CONFIG });
    this.value = value;
    this.itemType = "golden";
    this.userData.isCoin = true;
    this.userData.coinType = "golden";
  }
}
