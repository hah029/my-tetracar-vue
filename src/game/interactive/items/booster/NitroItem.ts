// /nitro/Nitro.ts
import { useCommonStore } from "@/store/commonStore";
import { BoosterItem } from "./BoosterItem";

export class NitroItem extends BoosterItem {
  constructor(zPos: number, laneIndex?: number, xPos?: number, yPos?: number) {
    super(zPos, laneIndex, xPos, yPos, useCommonStore().NITRO_MATERIAL_CONFIG);
  }
}
