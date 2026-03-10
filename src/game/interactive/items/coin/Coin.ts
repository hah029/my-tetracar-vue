// src/game/coin/Coin.ts

import { BaseItem } from "../BaseItem";
import { COIN_MATERIAL_CONFIG } from "./config";

export class Coin extends BaseItem {
  public value: number;

  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 10,
  ) {
    super(laneIndex, zPos, yPos, COIN_MATERIAL_CONFIG);
    this.value = value;
    this.itemType = "coin";
  }
}
