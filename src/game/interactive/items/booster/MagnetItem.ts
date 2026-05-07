// /nitro/Magnet.ts
import { BoosterItem } from "./BoosterItem";
import { MAGNET_MATERIAL_CONFIG } from "./config/MagnetConfig";

export class MagnetItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, MAGNET_MATERIAL_CONFIG);
  }
}
