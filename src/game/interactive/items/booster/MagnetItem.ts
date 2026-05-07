// /nitro/Magnet.ts
import type { BaseItem } from "../BaseItem";
import { CoinItem } from "../coin/CoinItem";
import { BoosterItem } from "./BoosterItem";
import { MAGNET_MATERIAL_CONFIG } from "./config/MagnetConfig";

export class MagnetItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, MAGNET_MATERIAL_CONFIG);

    this.userData.magnetTypes = [CoinItem];
  }
}
