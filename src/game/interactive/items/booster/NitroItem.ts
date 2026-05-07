// /nitro/Nitro.ts
import { BoosterItem } from "./BoosterItem";
import { NITRO_MATERIAL_CONFIG } from "./config/NitroConfig";

export class NitroItem extends BoosterItem {
  constructor(laneIndex: number, zPos: number, yPos?: number) {
    super(laneIndex, zPos, yPos, NITRO_MATERIAL_CONFIG);
  }
}
