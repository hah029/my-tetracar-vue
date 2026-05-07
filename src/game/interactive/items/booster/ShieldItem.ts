// /nitro/Nitro.ts
import { BoosterItem } from "./BoosterItem";
import { SHIELD_MATERIAL_CONFIG } from "./config/ShieldConfig";

export class ShieldItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, SHIELD_MATERIAL_CONFIG);
  }
}
