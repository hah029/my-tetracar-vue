// /nitro/Nitro.ts
import { BoosterItem } from "./BoosterItem";
import { NITRO_MATERIAL_CONFIG } from "./config/NitroConfig";

export class NitroItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, NITRO_MATERIAL_CONFIG);
  }
}
