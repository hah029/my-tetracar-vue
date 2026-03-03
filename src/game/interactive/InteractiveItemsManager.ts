// src/game/interactive/InteractiveItemsManager.ts
// import type * as THREE from "three";
import { ObstacleManager } from "@/game/obstacle/ObstacleManager";
import { RoadManager } from "@/game/road/RoadManager";
import type { CoinManager } from "@/game/coin/CoinManager";
import { simulateJumpTrajectory } from "@/game/car/CarTrajectory";
import { DEFAULT_CAR_CONFIG } from "@/game/car/config";
import { UpdateMode } from "@/game/core/UpdateMode";

export class InteractiveItemsManager {
  private obstacleManager: ObstacleManager;
  private coinManager: CoinManager;
  private roadManager: RoadManager;

  private obstacleTimer = 0;
  private coinTimer = 0;
  private obstacleInterval = 1600;
  private coinInterval = 1000;

  constructor(
    obstacleManager: ObstacleManager,
    coinManager: CoinManager,
    roadManager: RoadManager,
  ) {
    this.obstacleManager = obstacleManager;
    this.coinManager = coinManager;
    this.roadManager = roadManager;
  }

  public update(deltaTime: number, speed: number, mode: UpdateMode) {
    // obstacles / jumps
    this.obstacleTimer += deltaTime;
    const obstacleInterval = Math.max(300, this.obstacleInterval - speed * 5);

    this.obstacleManager.update(speed);
    this.coinManager.update(speed);

    if (mode === UpdateMode.Destruction) {
      return; // ⛔ стоп спавн, таймеры, геймплей
    }

    if (this.obstacleTimer >= obstacleInterval) {
      this.spawnObstacle(speed);
      this.obstacleTimer = 0;
    }
    // coins (независимо)
    this.coinTimer += deltaTime;
    const coinInterval = Math.max(200, this.coinInterval - speed * 2);

    if (this.coinTimer >= coinInterval) {
      this.spawnCoins();
      this.coinTimer = 0;
    }
  }

  // private spawnObstacleLine(speed: number) {
  //   const lanesCount = this.roadManager.getLanesCount();
  //   const emptyLane = Math.floor(Math.random() * lanesCount);

  //   for (let lane = 0; lane < lanesCount; lane++) {
  //     if (lane === emptyLane) continue;

  //     if (Math.random() < 0.1) {
  //       this.spawnJumpWithCoins(lane, speed);
  //     }

  //     this.obstacleManager.spawnObstacle(lane, -60);
  //   }
  // }

  private spawnObstacle(speed: number) {
    const lanesCount = this.roadManager.getLanesCount();
    const emptyLane = Math.floor(Math.random() * lanesCount);
    let isJumpSpawned = false;

    for (let lane = 0; lane < lanesCount; lane++) {
      if (lane === emptyLane) continue;

      if (Math.random() < 0.05 && isJumpSpawned == false) {
        isJumpSpawned = true;
        this.spawnJumpWithCoins(lane, speed);
      }

      this.obstacleManager.spawnObstacle(lane, -60, 0);
    }
    isJumpSpawned = false;
  }

  private spawnCoins() {
    const lanesCount = this.roadManager.getLanesCount();
    const lane = Math.floor(Math.random() * lanesCount);

    // одиночная монетка
    // this.coinManager.spawnCoin(lane, -60);

    // шанс на цепочку
    if (Math.random() < 0.1) {
      for (let i = 1; i <= 3; i++) {
        this.coinManager.spawnCoin(lane, -60 - i * 5);
      }
    }
  }

  private spawnJumpWithCoins(lane: number, speed: number) {
    const jumpZ = -60 + this.getJumpDistance(speed);
    this.obstacleManager.spawnJump(lane, jumpZ);

    const trajectory = simulateJumpTrajectory({
      startY: 0.5,
      jumpHeight: DEFAULT_CAR_CONFIG.jumpHeight,
      gravity: DEFAULT_CAR_CONFIG.gravity,
      forwardSpeed: speed,
    });

    const step = Math.max(2, Math.floor(trajectory.length / 6));
    for (let i = 0; i < trajectory.length; i += step) {
      const point = trajectory[i];
      if (point === undefined) continue;
      this.coinManager.spawnCoin(lane, jumpZ + 2 + point.zOffset, point.y, 5);
    }
  }

  private getJumpDistance(speed: number): number {
    const min = 2;
    const max = 8;
    const factor = Math.min(speed / 3, 1);
    return min + (max - min) * factor;
  }

  // прокси
  public getObstacles() {
    return this.obstacleManager.getObstacles();
  }

  public getJumps() {
    return this.obstacleManager.getJumps();
  }

  public reset() {
    this.obstacleTimer = 0;
    this.coinTimer = 0;
    this.obstacleManager.reset();
    this.coinManager.reset();
  }
}
