// /nitro/Nitro.ts
import { BoosterItem } from "./BoosterItem";
import { SHIELD_MATERIAL_CONFIG } from "./config/ShieldConfig";

export class ShieldItem extends BoosterItem {
  constructor(laneIndex: number, zPos: number, yPos?: number) {
    super(laneIndex, zPos, yPos, SHIELD_MATERIAL_CONFIG);
    this.userData.boosterType = "shield";
  }
}
