// /nitro/Nitro.ts
import { BaseItem } from "../BaseItem";
import { SHIELD_MATERIAL_CONFIG } from "./config/ShieldConfig";

export class Shield extends BaseItem {
  constructor(laneIndex: number, zPos: number, yPos: number = 0.2) {
    super(laneIndex, zPos, yPos, SHIELD_MATERIAL_CONFIG);
    this.itemType = "shield";
    this.userData.isBooster = true;
    this.userData.boosterType = "shield";
  }
}
