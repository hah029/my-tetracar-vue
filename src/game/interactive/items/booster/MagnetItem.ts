// /nitro/Magnet.ts
import { BoosterItem } from "./BoosterItem";
import { MAGNET_MATERIAL_CONFIG } from "./config/MagnetConfig";

export class MagnetItem extends BoosterItem {
  constructor(laneIndex: number, zPos: number, yPos?: number) {
    super(laneIndex, zPos, yPos, MAGNET_MATERIAL_CONFIG);
  }
}
