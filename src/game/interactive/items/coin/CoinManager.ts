import { Golden } from "./Golden";
import { Energon } from "./Energon";
import { makeWeightedChoice } from "@/helpers/functions";

export class CoinManager {
  private static instance: CoinManager | null = null;

  public readonly spawnProbabilities = {
    energon: 5,
    golden: 1000,
  };

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
    laneIndex: number,
    zPos: number,
    yPos?: number,
    value?: number,
  ) {
    let choice = makeWeightedChoice(this.spawnProbabilities);

    switch (choice) {
      case "energon":
        return this.spawnEnergon(laneIndex, zPos, yPos, value);
      case "golden":
        return this.spawnGolden(laneIndex, zPos, yPos, value);
      default:
        return this.spawnGolden(laneIndex, zPos, yPos, value);
    }
  }

  public spawnGolden(
    laneIndex: number,
    zPos: number,
    yPos?: number,
    value?: number,
  ) {
    return new Golden(laneIndex, zPos, yPos, value);
  }

  public spawnEnergon(
    laneIndex: number,
    zPos: number,
    yPos?: number,
    value?: number,
  ) {
    return new Energon(laneIndex, zPos, yPos, value);
  }
}
