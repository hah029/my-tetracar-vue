// src/game/coin/Coin.ts
import { MATERIAL_CONFIG } from "./config";
import { BoosterItem } from "./BoosterItem";

export class BulletItem extends BoosterItem {
  constructor(laneIndex: number, zPos: number, yPos: number = 0.2) {
    super(laneIndex, zPos, yPos, MATERIAL_CONFIG);
  }
}
