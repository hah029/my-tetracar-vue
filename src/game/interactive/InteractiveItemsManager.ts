// src/game/interactive/InteractiveItemsManager.ts
// managers
import { ObstacleManager } from "@/game/obstacle/ObstacleManager";
import { RoadManager } from "@/game/road/RoadManager";
import { CoinManager } from "@/game/coin/CoinManager";
import { BoosterManager } from "@/game/booster/BoosterManager";
// other
import { simulateJumpTrajectory } from "@/game/car/CarTrajectory";
import { DEFAULT_CAR_CONFIG } from "@/game/car/config";
import { UpdateMode } from "@/game/core/UpdateMode";
import { useGameState } from "@/store/gameState";
import { LanePattern } from "@/game/interactive/types/LanePattern";
import { SegmentQueue } from "./segments/SegmentQueue";

export class InteractiveItemsManager {
  private obstacleManager: ObstacleManager;
  private coinManager: CoinManager;
  private roadManager: RoadManager;
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
    roadManager: RoadManager,
    boosterManager: BoosterManager,
  ) {
    this.obstacleManager = obstacleManager;
    this.coinManager = coinManager;
    this.roadManager = roadManager;
    this.boosterManager = boosterManager;
    this.segmentQueue = new SegmentQueue(() => {
      const distance = useGameState().getDistance();
      return Math.floor(distance / this.difficultyStep) + 1;
    });
  }

  public update(deltaTime: number, speed: number, mode: UpdateMode) {
    // obstacles / jumps
    const distance = useGameState().getDistance();

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
    const gameState = useGameState();

    if (gameState.isNitroEnabled) {
      this.boosterEnabledTimer += deltaTime;
      gameState.nitroTimer -= deltaTime;
    }

    if (this.boosterEnabledTimer >= this.boosterEnabledInterval) {
      gameState.disableNitro();
      this.boosterEnabledTimer = 0;
    }
  }

  private spawnSegment(dt: number, speed: number, baseZ: number) {
    const segment = this.segmentQueue.getNext();

    const rowSpacing = 4;

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

          case LanePattern.BoosterNitro:
            this.spawnBooster(lane, z);
            break;
        }
      });
    });
  }

  private spawnSingleCoin(lane: number, baseZ: number) {
    this.coinManager.spawnCoin(lane, baseZ);
  }

  private spawnCoinLine(lane: number, baseZ: number) {
    for (let i = 0; i < 5; i++) {
      this.coinManager.spawnCoin(lane, baseZ - i * 4);
    }
  }

  private spawnBooster(lane: number, baseZ: number) {
    this.boosterManager.spawnNitro(lane, baseZ);
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
      startY: 0.5,
      jumpHeight: DEFAULT_CAR_CONFIG.jumpHeight,
      gravity: DEFAULT_CAR_CONFIG.gravity,
      deltaTime: deltaTime,
      forwardSpeed: speed,
    });

    const step = Math.max(2, Math.floor(trajectory.length / 6));
    for (let i = 0; i < trajectory.length; i += step) {
      const point = trajectory[i];
      if (point === undefined) continue;
      this.coinManager.spawnCoin(lane, jumpZ + 2 + point.zOffset, point.y, 5);
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
    return this.boosterManager.getNitros();
  }

  public reset() {
    this.obstacleManager.reset();
    this.coinManager.reset();
    this.boosterManager.reset();
  }
}
