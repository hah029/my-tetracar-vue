// src/game/interactive/InteractiveItemsManager.ts
// import type * as THREE from "three";
import { ObstacleManager } from "@/game/obstacle/ObstacleManager";
import { RoadManager } from "@/game/road/RoadManager";
import type { CoinManager } from "../coin/CoinManager";

export class InteractiveItemsManager {
  private obstacleManager: ObstacleManager;
  private coinManager: CoinManager;
  private roadManager: RoadManager;

  // private spawnTimer = 0;
  // private lastSpawnTime = 0;
  // private baseSpawnInterval = 500;

  private obstacleTimer = 0;
  private coinTimer = 0;

  private obstacleInterval = 500;
  private coinInterval = 300;

  constructor(
    obstacleManager: ObstacleManager,
    coinManager: CoinManager,
    roadManager: RoadManager,
  ) {
    this.obstacleManager = obstacleManager;
    this.coinManager = coinManager;
    this.roadManager = roadManager;
  }

  public update(deltaTime: number, speed: number) {
    // obstacles / jumps
    this.obstacleTimer += deltaTime;
    const obstacleInterval = Math.max(300, this.obstacleInterval - speed * 5);

    if (this.obstacleTimer >= obstacleInterval) {
      this.spawnObstacleLine(speed);
      this.obstacleTimer = 0;
    }

    // coins (независимо)
    this.coinTimer += deltaTime;
    const coinInterval = Math.max(200, this.coinInterval - speed * 2);

    if (this.coinTimer >= coinInterval) {
      this.spawnCoins();
      this.coinTimer = 0;
    }

    this.obstacleManager.update(speed);
    this.coinManager.update(speed);
  }

  private spawnObstacleLine(speed: number) {
    const lanesCount = this.roadManager.getLanesCount();
    const emptyLane = Math.floor(Math.random() * lanesCount);

    for (let lane = 0; lane < lanesCount; lane++) {
      if (lane === emptyLane) continue;

      if (Math.random() < 0.1) {
        const z = -60 + this.getJumpDistance(speed);
        this.obstacleManager.spawnJump(lane, z);
      }

      this.obstacleManager.spawnObstacle(lane, -60);
    }
  }

  private spawnCoins() {
    const lanesCount = this.roadManager.getLanesCount();
    const lane = Math.floor(Math.random() * lanesCount);

    // одиночная монетка
    this.coinManager.spawnCoin(lane, -60);

    // шанс на цепочку
    if (Math.random() < 0.3) {
      for (let i = 1; i <= 3; i++) {
        this.coinManager.spawnCoin(lane, -60 - i * 1.2);
      }
    }
  }

  // private spawnLine(speed: number) {
  //   const lanesCount = this.roadManager.getLanesCount();
  //   const emptyLane = Math.floor(Math.random() * lanesCount);

  //   for (let lane = 0; lane < lanesCount; lane++) {
  //     if (lane === emptyLane) {
  //       if (Math.random() < 0.6) {
  //         this.coinManager.spawnCoin(lane, -60);
  //       }
  //       continue;
  //     }

  //     // jump как часть паттерна
  //     if (Math.random() < 0.1) {
  //       const z = -60 + this.getJumpDistance(speed);
  //       this.obstacleManager.spawnJump(lane, z);
  //     }

  //     this.obstacleManager.spawnObstacle(lane, -60);
  //   }
  // }

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
    this.spawnTimer = 0;
    this.lastSpawnTime = 0;
    this.obstacleManager.reset();
    this.coinManager.reset();
  }
}
