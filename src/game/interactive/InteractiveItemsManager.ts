// src/game/interactive/InteractiveItemsManager.ts
// managers
import { ObstacleManager } from "./obstacle/ObstacleManager";
import { CoinManager } from "./items/coin/CoinManager";
import { BoosterManager } from "./items/booster/BoosterManager";
import { BulletItemManager } from "./items/bullet/BulletItemManager";
import { CarManager } from "../car";
// other
import { simulateJumpTrajectory } from "@/game/car/CarTrajectory";
import { DEFAULT_CAR_CONFIG } from "@/game/car/config";
import { UpdateMode } from "@/game/core/UpdateMode";
import { LanePattern } from "@/game/interactive/types/LanePattern";
import { SegmentQueue } from "./segments/SegmentQueue";
import {
  // SEGMENT_ROW_LENGTH,
  SEGMENT_ROW_BODY_LENGTH,
  SEGMENT_ROW_SPACING_LENGTH,
} from "./segments/SegmentLibrary";
// stores
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { useCommonStore } from "@/store/commonStore";
import { makeWeightedChoice } from "@/helpers/functions";

export class InteractiveItemsManager {
  private static instance: InteractiveItemsManager | null = null;
  private obstacleManager!: ObstacleManager;
  private coinManager!: CoinManager;
  private boosterManager!: BoosterManager;
  private bulletItemManager!: BulletItemManager;
  private segmentQueue!: SegmentQueue;
  private worldFrontZ = useCommonStore().BASE_SEGMENTS_ZPOS;
  private difficultyStep = useCommonStore().BASE_SEGMENT_DIFFICULTY_STEP;
  private nitroEnabledTimer = 0;
  private magnetEnabledTimer = 0;

  public static getInstance(): InteractiveItemsManager {
    if (!InteractiveItemsManager.instance) {
      InteractiveItemsManager.instance = new InteractiveItemsManager();
    }
    return InteractiveItemsManager.instance;
  }

  public initialize(
    obstacleManager: ObstacleManager,
    coinManager: CoinManager,
    boosterManager: BoosterManager,
    bulletItemManager: BulletItemManager,
  ) {
    this.obstacleManager = obstacleManager;
    this.coinManager = coinManager;
    this.boosterManager = boosterManager;
    this.bulletItemManager = bulletItemManager;
    this.segmentQueue = new SegmentQueue(() => {
      const distance = useProgressStore().getDistance();
      return Math.floor(distance / this.difficultyStep) + 1;
    });
  }

  public update(deltaTime: number, speed: number, mode: UpdateMode) {
    this.ensureWorldFilled(deltaTime, speed);

    this.obstacleManager.update(deltaTime, speed);
    this.coinManager.update(deltaTime, speed);
    this.boosterManager.update(deltaTime, speed);
    this.bulletItemManager.update(deltaTime, speed);

    if (mode === UpdateMode.Destruction) return;

    const playerStore = usePlayerStore();
    if (playerStore.isNitroEnabled) {
      this.nitroEnabledTimer += deltaTime;
      playerStore.nitroTimer -= deltaTime;

      if (this.nitroEnabledTimer >= usePlayerStore().BASE_NITRO_TIMER) {
        CarManager.getInstance().disableNitro();
        playerStore.disableNitro();
        this.nitroEnabledTimer = 0;
      }
    }
    if (playerStore.isMagnetEnabled) {
      this.magnetEnabledTimer += deltaTime;
      playerStore.magnetTimer -= deltaTime;

      if (this.magnetEnabledTimer >= usePlayerStore().BASE_MAGNET_TIMER) {
        // CarManager.getInstance().dis();
        playerStore.disableMagnet();
        this.magnetEnabledTimer = 0;
      }
    }
  }

  private ensureWorldFilled(deltaTime: number, speed: number) {
    // 🚫 защита от спама за кадр
    const MAX_SPAWNS_PER_FRAME = 2;
    let spawned = 0;

    const minZ = useCommonStore().BASE_SEGMENTS_ZPOS * 1.2;

    this.worldFrontZ += speed * deltaTime;

    while (this.worldFrontZ > minZ && spawned < MAX_SPAWNS_PER_FRAME) {
      const length = this.spawnSegment(deltaTime, speed, this.worldFrontZ);
      this.worldFrontZ = this.worldFrontZ - length;
      spawned++;
    }
  }

  public spawnSegment(dt: number, speed: number, baseZ: number) {
    const segment = this.segmentQueue.getNext();

    const isReversed = segment.canReversed ? Math.random() < 0.5 : false;

    // console.log("baseZ", baseZ);
    const segmentRowLength =
      SEGMENT_ROW_BODY_LENGTH + SEGMENT_ROW_SPACING_LENGTH * 1.1;

    segment.pattern.forEach((row, rowIndex) => {
      const z = baseZ - rowIndex * segmentRowLength;
      let row_ = [...row];

      if (isReversed) {
        row_ = row_.reverse();
      }

      row_.forEach((value, lane) => {
        switch (value) {
          case LanePattern.Obstacle:
            this.obstacleManager.spawnStaticObstacle(lane, z, 2);
            break;
          case LanePattern.Obstacle1:
            this.obstacleManager.spawnStaticObstacle(lane, z, 0);
            break;
          case LanePattern.Obstacle2:
            this.obstacleManager.spawnStaticObstacle(lane, z, 1);
            break;
          case LanePattern.Obstacle3:
            this.obstacleManager.spawnStaticObstacle(lane, z, 2);
            break;

          case LanePattern.Jump:
            this.spawnJump(lane, dt, speed, z);
            break;
          case LanePattern.JumpCoins:
            if (
              usePlayerStore().isNitroEnabled &&
              usePlayerStore().nitroTimer < Math.abs(z / speed)
            ) {
              this.spawnJumpWithCoins(
                lane,
                dt,
                speed / usePlayerStore().NITRO_MULTIPLIER,
                z,
              );
              break;
            }
            this.spawnJumpWithCoins(lane, dt, speed, z);
            break;

          case LanePattern.Coin:
            this.spawnSingleCoin(lane, z);
            break;
          case LanePattern.Energon:
            this.spawnEnergonCoin(lane, z);
            break;

          case LanePattern.CoinLine:
            this.spawnCoinLine(lane, z);
            break;

          case LanePattern.Booster:
            this.spawnBooster(lane, z);
            break;

          case LanePattern.Nitro:
            this.spawnNitroBooster(lane, z);
            break;

          case LanePattern.Shield:
            this.spawnShieldBooster(lane, z);
            break;

          case LanePattern.Magnet:
            this.spawnMagnetBooster(lane, z);
            break;

          case LanePattern.BulletItem:
            this.spawnBulletItem(lane, z);
            break;

          case LanePattern.MovingObstacle:
            this.obstacleManager.spawnMovingObstacle(lane, z, 1, 0);
            break;

          case LanePattern.EnemyCar:
            this.obstacleManager.spawnEnemyCar(lane, z);
            break;
        }
      });
    });

    return segment.pattern.length * segmentRowLength;
  }

  public spawnSingleCoin(lane: number, baseZ: number) {
    if (Math.random() < useCommonStore().ENERGON_SPAWN_PROBABILITY) {
      this.coinManager.spawnEnergon(lane, baseZ);
    } else {
      this.coinManager.spawnGolden(lane, baseZ);
    }
  }

  public spawnEnergonCoin(lane: number, baseZ: number) {
    this.coinManager.spawnEnergon(lane, baseZ);
  }

  public spawnGoldenCoin(lane: number, baseZ: number) {
    this.coinManager.spawnGolden(lane, baseZ);
  }

  public spawnCoinLine(lane: number, baseZ: number) {
    for (let i = 0; i < 5; i++) {
      this.coinManager.spawnGolden(lane, baseZ - i * 4);
    }
  }

  public spawnBooster(lane: number, baseZ: number) {
    const choice = makeWeightedChoice(this.boosterManager.spawnProbabilities);
    switch (choice) {
      case "nitro":
        this.boosterManager.spawnNitro(lane, baseZ);
        break;
      case "shield":
        this.boosterManager.spawnShield(lane, baseZ);
        break;
      case "magnet":
        this.boosterManager.spawnMagnet(lane, baseZ);
        break;
      default:
        // fallback, если choice неизвестен
        this.boosterManager.spawnShield(lane, baseZ);
    }
  }

  public spawnNitroBooster(lane: number, baseZ: number) {
    this.boosterManager.spawnNitro(lane, baseZ);
  }

  public spawnMagnetBooster(lane: number, baseZ: number) {
    this.boosterManager.spawnMagnet(lane, baseZ);
  }

  public spawnShieldBooster(lane: number, baseZ: number) {
    this.boosterManager.spawnShield(lane, baseZ);
  }

  public spawnBulletItem(lane: number, baseZ: number) {
    this.bulletItemManager.spawnBullet(lane, baseZ);
  }

  public spawnJumpWithCoins(
    lane: number,
    deltaTime: number,
    speed: number,
    baseZ: number,
  ) {
    const jumpZ = baseZ + this.getJumpDistance(deltaTime, speed);
    this.obstacleManager.spawnJump(lane, jumpZ);

    const trajectory = simulateJumpTrajectory({
      startY: 0.5, // высота машины при прыжке
      jumpHeight: DEFAULT_CAR_CONFIG.jumpHeight,
      gravity: useCommonStore().GRAVITY,
      deltaTime: deltaTime,
      forwardSpeed: speed,
    });

    const step = Math.max(1, Math.floor(trajectory.length / 10)); // больше монет
    for (let i = 0; i < trajectory.length; i += step) {
      const point = trajectory[i];
      if (point === undefined) continue;
      const coinZ = jumpZ + point.zOffset + 1;
      this.coinManager.spawnGolden(lane, coinZ, point.y);
    }
  }

  public spawnJump(
    lane: number,
    deltaTime: number,
    speed: number,
    baseZ: number,
  ) {
    const jumpZ = baseZ + this.getJumpDistance(deltaTime, speed);
    this.obstacleManager.spawnJump(lane, jumpZ);
  }

  private getJumpDistance(deltaTime: number, speed: number): number {
    const min = 2;
    const max = 8;
    const factor = Math.min((deltaTime * speed) / 3, 1);
    return min + (max - min) * factor;
  }

  // прокси
  public getObstacles() {
    return this.obstacleManager.getObstacles();
  }

  public getJumps() {
    return this.obstacleManager.getJumps();
  }

  public getBoosters() {
    return this.boosterManager.getBoosters();
  }

  public getBulletItems() {
    return this.bulletItemManager.getBullets();
  }

  public reset() {
    this.obstacleManager.reset();
    this.coinManager.reset();
    this.boosterManager.reset();
    this.bulletItemManager.reset();
    this.segmentQueue.reset();
    this.worldFrontZ = useCommonStore().BASE_SEGMENTS_ZPOS;
    this.nitroEnabledTimer = 0;
    this.magnetEnabledTimer = 0;
  }
}
