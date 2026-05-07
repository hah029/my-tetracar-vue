import { NitroItem } from "./NitroItem";
import { ShieldItem } from "./ShieldItem";
import { MagnetItem } from "./MagnetItem";
import { BulletItem } from "./BulletItem";
import { makeWeightedChoice } from "@/helpers/functions";

export class BoosterManager {
  private static instance: BoosterManager | null = null;

  public readonly spawnProbabilities = {
    nitro: 1,
    shield: 1,
    magnet: 1,
    bullet: 1,
  };

  public static getInstance(): BoosterManager {
    if (!BoosterManager.instance) {
      BoosterManager.instance = new BoosterManager();
    }
    return BoosterManager.instance;
  }

  /* =======================
     SPAWN
     ======================= */

  public spawnRandom(laneIndex: number, zPos: number, yPos?: number) {
    let choice = makeWeightedChoice(this.spawnProbabilities);

    switch (choice) {
      case "nitro":
        return this.spawnNitro(laneIndex, zPos, yPos);
      case "shield":
        return this.spawnShield(laneIndex, zPos, yPos);
      case "magnet":
        return this.spawnMagnet(laneIndex, zPos, yPos);
      case "bullet":
        return this.spawnBullet(laneIndex, zPos, yPos);
      default:
        return this.spawnShield(laneIndex, zPos, yPos);
    }
  }

  public spawnNitro(laneIndex: number, zPos: number, yPos?: number) {
    return new NitroItem(laneIndex, zPos, yPos);
  }

  public spawnMagnet(laneIndex: number, zPos: number, yPos?: number) {
    return new MagnetItem(laneIndex, zPos, yPos);
  }

  public spawnShield(laneIndex: number, zPos: number, yPos?: number) {
    return new ShieldItem(laneIndex, zPos, yPos);
  }

  public spawnBullet(laneIndex: number, zPos: number, yPos?: number) {
    return new BulletItem(laneIndex, zPos, yPos);
  }
}
