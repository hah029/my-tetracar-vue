import { Golden } from "./Golden";
import { Energon } from "./Energon";
import { makeWeightedChoice } from "@/helpers/functions";
import { useCommonStore } from "@/store/commonStore";
import { CoinTypes, type CoinType } from "./types";

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
    allowedTypes?: CoinType[],
  ) {
    let choice = this.pickCoinType(allowedTypes);

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

  private pickCoinType(allowedTypes?: CoinType[]): string {
    const weights = useCommonStore().config.spawnProbabilities.coins;
    const activeTypes = allowedTypes?.length
      ? allowedTypes
      : (Object.keys(weights) as CoinType[]);

    const filteredWeights = Object.fromEntries(
      Object.entries(weights).filter(([type]) =>
        activeTypes.includes(type as CoinType),
      ),
    );

    if (Object.values(filteredWeights).some((weight) => weight > 0)) {
      return makeWeightedChoice(filteredWeights);
    }

    return activeTypes[0] ?? CoinTypes.Golden;
  }
}
