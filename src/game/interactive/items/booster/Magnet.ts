// /nitro/Nitro.ts
import { BaseItem } from "../BaseItem";
import { MAGNET_MATERIAL_CONFIG } from "./config/MagnetConfig";

export class Magnet extends BaseItem {
  constructor(laneIndex: number, zPos: number, yPos?: number) {
    super(laneIndex, zPos, yPos, MAGNET_MATERIAL_CONFIG);
    this.itemType = "magnet";
    this.userData.isBooster = true;
    this.userData.boosterType = "magnet";
  }
}
