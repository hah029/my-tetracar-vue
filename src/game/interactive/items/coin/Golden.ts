// src/game/coin/Coin.ts

import { useCommonStore } from "@/store/commonStore";
import { CoinItem } from "./CoinItem";
import { GOLDEN_MATERIAL_CONFIG } from "./config";

export class Golden extends CoinItem {
  constructor(
    laneIndex: number,
    zPos: number,
    yPos?: number,
    value: number = useCommonStore().BASE_COIN_VALUE,
  ) {
    super(laneIndex, zPos, yPos, { ...GOLDEN_MATERIAL_CONFIG });
    this.value = value;
    this.itemType = "golden";
    this.userData.isCoin = true;
    this.userData.coinType = "golden";
  }
}
