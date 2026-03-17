// src/game/interactive/InteractiveItemsManager.ts
// managers
import { ObstacleManager } from "./obstacle/ObstacleManager";
import { CoinManager } from "./items/coin/CoinManager";
import { BoosterManager } from "./items/booster/BoosterManager";
import { BulletItemManager } from "./items/bullet/BulletItemManager";
// other
import { simulateJumpTrajectory } from "@/game/car/CarTrajectory";
import { DEFAULT_CAR_CONFIG } from "@/game/car/config";
import { UpdateMode } from "@/game/core/UpdateMode";
import { LanePattern } from "@/game/interactive/types/LanePattern";
import { SegmentQueue } from "./segments/SegmentQueue";
// stores
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { CarManager } from "../car";

export class InteractiveItemsManager {
  private static instance: InteractiveItemsManager | null = null;
  private obstacleManager!: ObstacleManager;
  private coinManager!: CoinManager;
  private boosterManager!: BoosterManager;
  private bulletItemManager!: BulletItemManager;
  private segmentQueue!: SegmentQueue;
  private distanceSinceLastSegment = 0;
  private segmentLength = 18;
  private difficultyStep = 150;
  private nextSegmentZ = -60;
  private boosterEnabledTimer = 0;
  private boosterEnabledInterval = 5000;

  public static getInstance(): InteractiveItemsManager {
    if (!InteractiveItemsManager.instance) {
      InteractiveItemsManager.instance = new InteractiveItemsManager();
    }
    return InteractiveItemsManager.instance;
  }

  // private constructor(
  //   obstacleManager: ObstacleManager,
  //   coinManager: CoinManager,
  //   boosterManager: BoosterManager,
  //   bulletItemManager: BulletItemManager,
  // ) {
  //   this.obstacleManager = obstacleManager;
  //   this.coinManager = coinManager;
  //   this.boosterManager = boosterManager;
  //   this.bulletItemManager = bulletItemManager;
  //   this.segmentQueue = new SegmentQueue(() => {
  //     const distance = useProgressStore().getDistance();
  //     return Math.floor(distance / this.difficultyStep) + 1;
  //   });
  // }

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
    // obstacles / jumps
    const distance = useProgressStore().getDistance();

    if (distance - this.distanceSinceLastSegment >= this.segmentLength) {
      this.spawnSegment(deltaTime, speed, this.nextSegmentZ);
      this.nextSegmentZ -= this.segmentLength;
      this.distanceSinceLastSegment = distance;
    }

    this.obstacleManager.update(deltaTime, speed);
    this.coinManager.update(deltaTime, speed);
    this.boosterManager.update(deltaTime, speed);
    this.bulletItemManager.update(deltaTime, speed);

    if (mode === UpdateMode.Destruction) {
      return; // ⛔ стоп спавн, таймеры, геймплей
    }
    const playerStore = usePlayerStore();

    if (playerStore.isNitroEnabled) {
      this.boosterEnabledTimer += deltaTime;
      playerStore.nitroTimer -= deltaTime;
    }

    if (this.boosterEnabledTimer >= this.boosterEnabledInterval) {
      CarManager.getInstance().disableNitro();
      playerStore.disableNitro();
      this.boosterEnabledTimer = 0;
    }
  }

  public spawnSegment(dt: number, speed: number, baseZ: number) {
    const segment = this.segmentQueue.getNext();

    const rowSpacing = 3;

    segment.pattern.forEach((row, rowIndex) => {
      const z = baseZ - rowIndex * rowSpacing;

      row.forEach((value, lane) => {
        switch (value) {
          case LanePattern.Obstacle:
            this.obstacleManager.spawnStaticObstacle(lane, z);
            break;

          case LanePattern.Jump:
            this.spawnJumpWithCoins(lane, dt, speed, z);
            break;

          case LanePattern.Coin:
            this.spawnSingleCoin(lane, z);
            break;

          case LanePattern.CoinLine:
            this.spawnCoinLine(lane, z);
            break;

          case LanePattern.Booster:
            this.spawnBooster(lane, z);
            break;

          case LanePattern.BulletItem:
            this.spawnBulletItem(lane, z);
            break;

          case LanePattern.MovingObstacle:
            this.obstacleManager.spawnMovingObstacle(lane, 1);
            break;

          case LanePattern.EnemyCar:
            this.obstacleManager.spawnEnemyCar(lane, z);
            break;
        }
      });
    });
  }

  public spawnSingleCoin(lane: number, baseZ: number) {
    if (Math.random() < 0.5) {
      this.coinManager.spawnDiamond(lane, baseZ);
    } else {
      this.coinManager.spawnGold(lane, baseZ);
    }
  }

  public spawnDiamondCoin(lane: number, baseZ: number) {
    this.coinManager.spawnDiamond(lane, baseZ);
  }
  public spawnGoldCoin(lane: number, baseZ: number) {
    this.coinManager.spawnGold(lane, baseZ);
  }

  public spawnCoinLine(lane: number, baseZ: number) {
    for (let i = 0; i < 5; i++) {
      this.coinManager.spawnGold(lane, baseZ - i * 4);
    }
  }

  public spawnBooster(lane: number, baseZ: number) {
    if (Math.random() < 0.5) {
      this.boosterManager.spawnNitro(lane, baseZ);
    } else {
      this.boosterManager.spawnShield(lane, baseZ);
    }
  }
  public spawnNitroBooster(lane: number, baseZ: number) {
    this.boosterManager.spawnNitro(lane, baseZ);
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
      startY: 0, // высота машины при прыжке
      jumpHeight: DEFAULT_CAR_CONFIG.jumpHeight,
      gravity: DEFAULT_CAR_CONFIG.gravity,
      deltaTime: deltaTime,
      forwardSpeed: speed,
    });

    const step = Math.max(1, Math.floor(trajectory.length / 10)); // больше монет
    for (let i = 0; i < trajectory.length; i += step) {
      const point = trajectory[i];
      if (point === undefined) continue;
      const coinZ = jumpZ + point.zOffset;
      this.coinManager.spawnGold(lane, coinZ, point.y, 5);
    }
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
    this.distanceSinceLastSegment = 0;
    this.nextSegmentZ = -60;
    this.boosterEnabledTimer = 0;
  }
}
