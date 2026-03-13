// src/game/coin/Coin.ts

import { BaseItem } from "../BaseItem";
import { MATERIAL_CONFIG } from "./config";

export class BulletItem extends BaseItem {
  public value: number;

  constructor(
    laneIndex: number,
    zPos: number,
    yPos: number = 0.2,
    value: number = 10,
  ) {
    super(laneIndex, zPos, yPos, MATERIAL_CONFIG);
    this.value = value;
    this.itemType = "bullet";
  }
}
