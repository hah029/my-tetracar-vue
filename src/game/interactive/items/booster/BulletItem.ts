// src/game/coin/Coin.ts
import { BoosterItem } from "./BoosterItem";
import { MATERIAL_CONFIG } from "./config";

export class BulletItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, MATERIAL_CONFIG);
  }
}
