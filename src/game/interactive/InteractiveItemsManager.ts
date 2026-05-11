// src/game/interactive/InteractiveItemsManager.ts
import * as THREE from "three";
// managers
import { ObstacleManager } from "./obstacle/ObstacleManager";
import { CoinManager } from "./items/coin/CoinManager";
import { BoosterManager } from "./items/booster/BoosterManager";
import { Car, CarManager } from "../car";
// other
import { UpdateMode } from "@/game/core/UpdateMode";
import { LanePattern } from "@/game/interactive/types/LanePattern";
import { SegmentQueue } from "./segments/SegmentQueue";
// stores
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { useCommonStore } from "@/store/commonStore";
import type { BaseItem } from "./items/BaseItem";
import type { BaseObstacle } from "./obstacle/BaseObstacle";
import { MagnetSystem } from "../magnet/MagnetSystem";
import { DestructionManager } from "./DestructionManager";
import { simulateJumpTrajectory } from "../physics/JumpSimulator";

export class InteractiveItemsManager {
  private static instance: InteractiveItemsManager | null = null;
  private items: BaseItem[] = [];
  private scene!: THREE.Scene;

  private obstacleManager!: ObstacleManager;
  private coinManager!: CoinManager;
  private boosterManager!: BoosterManager;
  private segmentQueue!: SegmentQueue;
  private worldFrontZ = useCommonStore().BASE_SEGMENTS_ZPOS;
  private difficultyStep = useCommonStore().BASE_SEGMENT_DIFFICULTY_STEP;
  private nitroEnabledTimer = 0;
  private magnetEnabledTimer = 0;
  private magnetSystem = MagnetSystem.getInstance();
  private destructionManager = DestructionManager.getInstance();

  public static getInstance(): InteractiveItemsManager {
    if (!InteractiveItemsManager.instance) {
      InteractiveItemsManager.instance = new InteractiveItemsManager();
    }
    return InteractiveItemsManager.instance;
  }

  public initialize(scene: THREE.Scene, obstacleManager: ObstacleManager) {
    this.scene = scene;
    this.obstacleManager = obstacleManager;

    this.coinManager = CoinManager.getInstance();
    this.boosterManager = BoosterManager.getInstance();
    this.destructionManager = DestructionManager.getInstance();
    this.magnetSystem.initialize(scene);

    this.segmentQueue = new SegmentQueue(() => {
      const distance = useProgressStore().getDistance();
      return Math.floor(distance / this.difficultyStep) + 1;
    });
  }

  public update(car: Car, deltaTime: number, speed: number, mode: UpdateMode) {
    this.prePhysics(deltaTime, speed);
    this.updatePhysics(car, deltaTime, speed);

    if (mode === UpdateMode.Destruction) return;

    this.updatePlayerEffects(deltaTime);
  }

  private prePhysics(deltaTime: number, speed: number) {
    this.ensureWorldFilled(deltaTime, speed);
  }

  private updatePhysics(car: Car, deltaTime: number, speed: number) {
    this.obstacleManager.update(deltaTime, speed);
    const items = this.getItems();

    // update magnet
    this.magnetSystem.applyMagnet(car, items, usePlayerStore().magnetTypes);
    this.magnetSystem.updateMagnetedItems(
      car,
      items.filter((item) => item.userData.status === "magnetized"),
      deltaTime,
      performance.now(),
    );

    // update destroyed
    this.destructionManager.update(
      items.filter((item) => item.userData.status === "flying"),
      deltaTime,
      speed,
    );

    // base physics
    this.updateItems(
      // items.filter((item) => item.userData.status === "landed"),
      items,
      deltaTime,
      speed,
    );
  }

  private updatePlayerEffects(deltaTime: number) {
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
        playerStore.disableMagnet();
        this.magnetEnabledTimer = 0;
      }
    }
  }

  private ensureWorldFilled(deltaTime: number, speed: number) {
    // 🚫 защита от спама за кадр
    const MAX_SPAWNS_PER_FRAME = 1;
    let spawned = 0;

    const minZ = useCommonStore().BASE_SEGMENTS_ZPOS * 1.2;

    this.worldFrontZ += speed * deltaTime;

    while (this.worldFrontZ > minZ && spawned < MAX_SPAWNS_PER_FRAME) {
      console.log("this.worldFrontZ", this.worldFrontZ);
      const length = this.spawnSegment(deltaTime, speed, this.worldFrontZ);
      this.worldFrontZ = this.worldFrontZ - length;
      spawned++;
    }
  }

  public spawnSegment(dt: number, speed: number, baseZ: number) {
    const segment = this.segmentQueue.getNext();
    const isReversed = segment.canReversed ? Math.random() < 0.5 : false;

    const commonStore = useCommonStore();

    const baseMultiplier = 30;
    // const baseMultiplier = 20;

    const segmentRowLength =
      commonStore.SEGMENT_ROW_BODY_LENGTH +
      commonStore.SEGMENT_ROW_SPACING_LENGTH *
        ((baseMultiplier * speed) / usePlayerStore().maxSpeed);

    console.log("segmentRowLength", segmentRowLength);

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
            this.spawnSingleCoin(z, lane);
            break;
          case LanePattern.Energon:
            this.spawnEnergonCoin(z, lane);
            break;
          case LanePattern.CoinLine:
            this.spawnCoinLine(z, lane);
            break;
          case LanePattern.Booster:
            this.spawnBooster(z, lane);
            break;
          case LanePattern.Nitro:
            this.spawnNitroBooster(z, lane);
            break;
          case LanePattern.Shield:
            this.spawnShieldBooster(z, lane);
            break;
          case LanePattern.Magnet:
            this.spawnMagnetBooster(z, lane);
            break;
          case LanePattern.BulletItem:
            this.spawnBulletItem(z, lane);
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

  // спавн объектов
  public spawnSingleCoin(baseZ: number, laneIndex?: number, posX?: number) {
    const item = this.coinManager.spawnRandom(
      baseZ,
      laneIndex,
      posX,
    ) as BaseItem;
    if (item) {
      this.addItem(item);
      return item;
    }
    return null;
  }

  public spawnEnergonCoin(baseZ: number, laneIndex?: number, xPos?: number) {
    const item = this.coinManager.spawnEnergon(
      baseZ,
      laneIndex,
      xPos,
    ) as BaseItem;
    if (item) {
      this.addItem(item);
      return item;
    }
    return null;
  }

  public spawnGoldenCoin(baseZ: number, laneIndex?: number, xPos?: number) {
    const item = this.coinManager.spawnGolden(
      baseZ,
      laneIndex,
      xPos,
    ) as BaseItem;
    if (item) {
      this.addItem(item);
      return item;
    }
    return null;
  }

  public spawnCoinLine(
    baseZ: number,
    laneIndex: number,
    count: number = 5,
    spacing: number = 4,
  ) {
    for (let i = 0; i < count; i++) {
      const item = this.coinManager.spawnGolden(
        baseZ - i * spacing,
        laneIndex,
      ) as BaseItem;
      if (item) {
        this.addItem(item);
      }
    }
  }

  public spawnBooster(baseZ: number, laneIndex?: number, xPos?: number) {
    const item = this.boosterManager.spawnRandom(baseZ, laneIndex, xPos);
    if (item) {
      this.addItem(item);
      return item;
    }
    return null;
  }

  public spawnNitroBooster(baseZ: number, laneIndex?: number, xPos?: number) {
    const item = this.boosterManager.spawnNitro(baseZ, laneIndex, xPos);
    if (item) {
      this.addItem(item);
      return item;
    }
    return null;
  }

  public spawnMagnetBooster(baseZ: number, laneIndex?: number, xPos?: number) {
    const item = this.boosterManager.spawnMagnet(baseZ, laneIndex, xPos);
    if (item) {
      this.addItem(item);
      return item;
    }
    return null;
  }

  public spawnShieldBooster(baseZ: number, laneIndex?: number, xPos?: number) {
    const item = this.boosterManager.spawnShield(baseZ, laneIndex, xPos);
    if (item) {
      this.addItem(item);
      return item;
    }
    return null;
  }

  public spawnBulletItem(baseZ: number, laneIndex?: number, xPos?: number) {
    const item = this.boosterManager.spawnBullet(baseZ, laneIndex, xPos);
    if (item) {
      this.addItem(item);
      return item;
    }
    return null;
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
      jumpHeight: usePlayerStore().JUMP_HEIGHT,
      gravity: useCommonStore().GRAVITY,
      deltaTime: deltaTime,
      forwardSpeed: speed,
    });

    const step = Math.max(1, Math.floor(trajectory.length / 10)); // больше монет
    let item: BaseItem | null = null;
    for (let i = 0; i < trajectory.length; i += step) {
      const point = trajectory[i];
      if (point === undefined) continue;
      const coinZ = jumpZ + point.zOffset + 1;
      item = this.coinManager.spawnGolden(
        coinZ,
        lane,
        undefined,
        point.y,
      ) as BaseItem;

      if (item) this.addItem(item);
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
  public getObstacles(): BaseObstacle[] {
    return this.obstacleManager.getObstacles();
  }

  public getItems(): BaseItem[] {
    return this.items;
  }

  public reset() {
    this.obstacleManager.reset();

    this.items.forEach((item) => {
      if (item.userData.magnetLine) this.scene.remove(item.userData.magnetLine);

      this.scene.remove(item);
    });
    this.items = [];

    this.segmentQueue.reset();

    this.worldFrontZ = useCommonStore().BASE_SEGMENTS_ZPOS;
    this.nitroEnabledTimer = 0;
    this.magnetEnabledTimer = 0;
  }

  public addItem(item: BaseItem) {
    this.items.push(item);
    this.scene.add(item);
  }

  public removeItem(item: BaseItem) {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
    }

    const line = item.userData.magnetLine;
    if (line) this.scene.remove(line);

    this.scene.remove(item);
  }

  public updateItems(items: BaseItem[], deltaTime: number, speed: number) {
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item.update(deltaTime, speed)) {
        this.removeItem(item);
      }
    }
  }
}
