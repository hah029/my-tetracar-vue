import { NitroItem } from "./NitroItem";
import { ShieldItem } from "./ShieldItem";
import { MagnetItem } from "./MagnetItem";
import { BulletItem } from "./BulletItem";
import { makeWeightedChoice } from "@/helpers/functions";
import { useCommonStore } from "@/store/commonStore";

export class BoosterManager {
  private static instance: BoosterManager | null = null;

  public static getInstance(): BoosterManager {
    if (!BoosterManager.instance) {
      BoosterManager.instance = new BoosterManager();
    }
    return BoosterManager.instance;
  }

  /* =======================
     SPAWN
     ======================= */

  public spawnRandom(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
  ) {
    let choice = makeWeightedChoice(
      useCommonStore().BOOSTER_SPAWN_PROBABILITIES,
    );

    switch (choice) {
      case "nitro":
        return this.spawnNitro(zPos, laneIndex, xPos, yPos);
      case "shield":
        return this.spawnShield(zPos, laneIndex, xPos, yPos);
      case "magnet":
        return this.spawnMagnet(zPos, laneIndex, xPos, yPos);
      case "bullet":
        return this.spawnBullet(zPos, laneIndex, xPos, yPos);
      default:
        return this.spawnShield(zPos, laneIndex, xPos, yPos);
    }
  }

  public spawnNitro(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
  ) {
    return new NitroItem(zPos, laneIndex, xPos, yPos);
  }

  public spawnMagnet(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
  ) {
    return new MagnetItem(zPos, laneIndex, xPos, yPos);
  }

  public spawnShield(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
  ) {
    return new ShieldItem(zPos, laneIndex, xPos, yPos);
  }

  public spawnBullet(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
  ) {
    return new BulletItem(zPos, laneIndex, xPos, yPos);
  }
}
