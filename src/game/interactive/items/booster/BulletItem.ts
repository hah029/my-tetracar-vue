// src/game/coin/Coin.ts
import { useCommonStore } from "@/store/commonStore";
import { BoosterItem } from "./BoosterItem";

export class BulletItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, useCommonStore().BULLET_MATERIAL_CONFIG);
  }
}
