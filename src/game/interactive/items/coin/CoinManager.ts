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
    baseZ: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
    value?: number,
  ) {
    let choice = makeWeightedChoice(this.spawnProbabilities);

    switch (choice) {
      case "energon":
        return this.spawnEnergon(baseZ, laneIndex, xPos, yPos, value);
      case "golden":
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
