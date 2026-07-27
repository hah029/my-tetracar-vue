// /nitro/Nitro.ts
import { BoosterItem } from "./BoosterItem";
import { MaterialPool } from "@/helpers/MaterialPool";

export class ShieldItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, null, MaterialPool.getShieldMaterial());
  }
}
