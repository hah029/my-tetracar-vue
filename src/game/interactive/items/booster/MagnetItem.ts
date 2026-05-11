// /nitro/Magnet.ts
import { useCommonStore } from "@/store/commonStore";
import { CoinItem } from "../coin/CoinItem";
import { BoosterItem } from "./BoosterItem";

export class MagnetItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, useCommonStore().MAGNET_MATERIAL_CONFIG);

    this.userData.magnetTypes = [CoinItem];
  }
}
