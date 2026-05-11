import { Golden } from "./Golden";
import { Energon } from "./Energon";
import { makeWeightedChoice } from "@/helpers/functions";
import { useCommonStore } from "@/store/commonStore";
import { CoinTypes } from "./types";

export class CoinManager {
  private static instance: CoinManager | null = null;

  public static getInstance(): CoinManager {
    if (!CoinManager.instance) {
      CoinManager.instance = new CoinManager();
    }
    return CoinManager.instance;
  }

  /* =======================
     SPAWN
     ======================= */

  public spawnRandom(
    baseZ: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
    value?: number,
  ) {
    let choice = makeWeightedChoice(useCommonStore().COIN_SPAWN_PROBABILITIES);

    switch (choice) {
      case CoinTypes.Energon:
        return this.spawnEnergon(baseZ, laneIndex, xPos, yPos, value);
      case CoinTypes.Golden:
        return this.spawnGolden(baseZ, laneIndex, xPos, yPos, value);
      default:
        return this.spawnGolden(baseZ, laneIndex, xPos, yPos, value);
    }
  }

  public spawnGolden(
    baseZ: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
    value?: number,
  ) {
    return new Golden(baseZ, laneIndex, xPos, yPos, value);
  }

  public spawnEnergon(
    baseZ: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
    value?: number,
  ) {
    return new Energon(baseZ, laneIndex, xPos, yPos, value);
  }
}
