// src/game/interactive/items/booster/NitroItem.ts

import { BoosterItem } from "./BoosterItem";
import { MaterialPool } from "@/helpers/MaterialPool";

export class NitroItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, null, MaterialPool.getNitroMaterial());
  }
}