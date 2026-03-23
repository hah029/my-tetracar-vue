// /nitro/Nitro.ts
import { BaseItem } from "../BaseItem";
import { NITRO_MATERIAL_CONFIG } from "./config/NitroConfig";

export class Nitro extends BaseItem {
  constructor(laneIndex: number, zPos: number, yPos: number = 0.2) {
    super(laneIndex, zPos, yPos, NITRO_MATERIAL_CONFIG);
    this.itemType = "nitro";
    this.userData.isBooster = true;
    this.userData.boosterType = "nitro";
  }
}
