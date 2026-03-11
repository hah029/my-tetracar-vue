// src/game/interactive/InteractiveItemsManager.ts
// managers
import { ObstacleManager } from "./obstacle/ObstacleManager";
import { CoinManager } from "./items/coin/CoinManager";
import { BoosterManager } from "./items/booster/BoosterManager";
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
  private obstacleManager: ObstacleManager;
  private coinManager: CoinManager;
  private boosterManager: BoosterManager;
  private segmentQueue: SegmentQueue;
  private distanceSinceLastSegment = 0;
  private segmentLength = 18;
  private difficultyStep = 150;
  private nextSegmentZ = -60;
  private boosterEnabledTimer = 0;
  private boosterEnabledInterval = 5000;

  constructor(
    obstacleManager: ObstacleManager,
    coinManager: CoinManager,
    boosterManager: BoosterManager,
  ) {
    this.obstacleManager = obstacleManager;
    this.coinManager = coinManager;
    this.boosterManager = boosterManager;
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

  private spawnSegment(dt: number, speed: number, baseZ: number) {
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

  private spawnSingleCoin(lane: number, baseZ: number) {
    if (Math.random() < 0.5) {
      this.coinManager.spawnDiamond(lane, baseZ);
    } else {
      this.coinManager.spawnGold(lane, baseZ);
    }
  }

  private spawnCoinLine(lane: number, baseZ: number) {
    for (let i = 0; i < 5; i++) {
      this.coinManager.spawnGold(lane, baseZ - i * 4);
    }
  }

  private spawnBooster(lane: number, baseZ: number) {
    if (Math.random() < 0.5) {
      this.boosterManager.spawnNitro(lane, baseZ);
    } else {
      this.boosterManager.spawnShield(lane, baseZ);
    }
  }

  private spawnJumpWithCoins(
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

    // console.log("[spawnJumpWithCoins]", {
    //   lane,
    //   deltaTime,
    //   speed,
    //   baseZ,
    //   jumpZ,
    //   trajectoryLength: trajectory.length,
    //   trajectory: trajectory.map((p) => ({ y: p.y, zOffset: p.zOffset })),
    //   config: {
    //     startY: 0,
    //     jumpHeight: DEFAULT_CAR_CONFIG.jumpHeight,
    //     gravity: DEFAULT_CAR_CONFIG.gravity,
    //   },
    // });

    const step = Math.max(1, Math.floor(trajectory.length / 10)); // больше монет
    for (let i = 0; i < trajectory.length; i += step) {
      const point = trajectory[i];
      if (point === undefined) continue;
      const coinZ = jumpZ + point.zOffset; // убрали +2
      // console.log(
      //   `  coin ${i}: y=${point.y}, zOffset=${point.zOffset}, coinZ=${coinZ}`,
      // );
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

  public reset() {
    this.obstacleManager.reset();
    this.coinManager.reset();
    this.boosterManager.reset();
    this.segmentQueue.reset();
    this.distanceSinceLastSegment = 0;
    this.nextSegmentZ = -60;
    this.boosterEnabledTimer = 0;
  }
}
