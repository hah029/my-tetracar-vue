// /nitro/Nitro.ts
import { useCommonStore } from "@/store/commonStore";
import { BoosterItem } from "./BoosterItem";

export class ShieldItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, useCommonStore().SHIELD_MATERIAL_CONFIG);
  }
}
