// /nitro/Magnet.ts
import { useCommonStore } from "@/store/commonStore";
import { CoinItem } from "../coin/CoinItem";
import { BoosterItem } from "./BoosterItem";
import { MaterialPool } from "@/helpers/MaterialPool";

export class MagnetItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, null, MaterialPool.getMagnetMaterial());
    this.userData.magnetTypes = [CoinItem];
  }
}
