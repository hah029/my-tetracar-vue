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
import { useLevelStore } from "@/store/levelStore";
import type { BaseItem } from "./items/BaseItem";
import type { BaseObstacle } from "./obstacle/BaseObstacle";
import { MagnetSystem } from "../magnet/MagnetSystem";
import { DestructionManager } from "./DestructionManager";
import { simulateJumpTrajectory } from "../physics/JumpSimulator";
import { resolveLanePatternBySpawnRules } from "@/levels/spawnRules";
import { BoosterItem } from "./items/booster/BoosterItem";
import { NitroItem } from "./items/booster/NitroItem";
import { ShieldItem } from "./items/booster/ShieldItem";
import { MagnetItem } from "./items/booster/MagnetItem";
import type { CorruptedBoostVariant } from "@/levels/types";
import { RoadManager } from "@/game/environment/road";
import type { Segment, SegmentElevatedSection } from "./segments/Segment";

type ItemSpawnSource = "segment" | "drop";

export class InteractiveItemsManager {
  private static instance: InteractiveItemsManager | null = null;
  private items: BaseItem[] = [];
  private scene!: THREE.Scene;

  private obstacleManager!: ObstacleManager;
  private coinManager!: CoinManager;
  private boosterManager!: BoosterManager;
  private segmentQueue!: SegmentQueue;
  private worldFrontZ = useCommonStore().config.baseSegmentsZpos;
  private difficultyStep = useCommonStore().config.baseSegmentDifficultyStep;
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
    }, () => {
      return useLevelStore().currentGameplay.laneCount;
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
      items.filter((item) => item.userData.status !== "magnetized"),
      // items,
      deltaTime,
      speed,
    );
  }

  private updatePlayerEffects(deltaTime: number) {
    const playerStore = usePlayerStore();
    if (playerStore.isNitroEnabled) {
      playerStore.nitroTimer = Math.max(0, playerStore.nitroTimer - deltaTime);

      if (playerStore.nitroTimer <= 0) {
        CarManager.getInstance().disableNitro();
        playerStore.disableNitro();
        this.nitroEnabledTimer = 0;
      }
    }
    if (playerStore.isMagnetEnabled) {
      playerStore.magnetTimer = Math.max(
        0,
        playerStore.magnetTimer - deltaTime,
      );

      if (playerStore.magnetTimer <= 0) {
        playerStore.disableMagnet();
        this.magnetEnabledTimer = 0;
      }
    }
  }

  private ensureWorldFilled(deltaTime: number, speed: number) {
    // Ограничение защищает от всплеска объектов, но дает догнать высокую скорость.
    const MAX_SPAWNS_PER_FRAME = 6;
    let spawned = 0;

    const cfg = useCommonStore().config;
    const rowLength = Math.max(
      cfg.segmentRowMinLength,
      speed * cfg.segmentRowTargetTravelMs,
    );
    const spawnAheadBuffer = Math.max(
      Math.abs(cfg.baseSegmentsZpos) * 0.2,
      rowLength * 8,
    );
    const minZ = cfg.baseSegmentsZpos - spawnAheadBuffer;

    this.worldFrontZ += speed * deltaTime;

    while (this.worldFrontZ > minZ && spawned < MAX_SPAWNS_PER_FRAME) {
      // console.log("this.worldFrontZ", this.worldFrontZ);
      const length = this.spawnSegment(deltaTime, speed, this.worldFrontZ);
      this.worldFrontZ = this.worldFrontZ - length;
      spawned++;
    }
  }

  public spawnSegment(dt: number, speed: number, baseZ: number) {
    const segment = this.segmentQueue.getNext();
    const isReversed = segment.canReversed ? Math.random() < 0.5 : false;
    const spawnRules = useLevelStore().getCurrentSpawnRules();

    const cfg = useCommonStore().config;

    const segmentRowLength = Math.max(
      cfg.segmentRowMinLength,
      speed * cfg.segmentRowTargetTravelMs,
    );

    this.spawnElevatedSectionsForSegment(
      segment,
      isReversed,
      baseZ,
      segmentRowLength,
    );
    this.spawnRoadSurfaceForSegment(
      segment,
      isReversed,
      baseZ,
      segmentRowLength,
    );

    // console.log("segmentRowLength", segmentRowLength);

    segment.pattern.forEach((row, rowIndex) => {
      const z = baseZ - rowIndex * segmentRowLength;
      const row_ = isReversed ? [...row].reverse() : row;

      row_.forEach((rawValue, lane) => {
        const value = resolveLanePatternBySpawnRules(
          rawValue,
          spawnRules,
        );

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
            this.spawnSingleCoin(z, lane, undefined, spawnRules.coinTypes);
            break;
          case LanePattern.Energon:
            this.spawnEnergonCoin(z, lane);
            break;
          case LanePattern.CoinLine:
            this.spawnCoinLine(z, lane);
            break;
          case LanePattern.Booster:
            this.spawnBooster(
              z,
              lane,
              undefined,
              spawnRules.boosterTypes.filter((type) => type !== "nitro"),
            );
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
  public spawnSingleCoin(
    baseZ: number,
    laneIndex?: number,
    posX?: number,
    allowedTypes?: ("golden" | "energon")[],
    source: ItemSpawnSource = "segment",
  ) {
    const item = this.coinManager.spawnRandom(
      baseZ,
      laneIndex,
      posX,
      this.getSurfaceItemY(baseZ, laneIndex),
      undefined,
      allowedTypes,
    ) as BaseItem;
    if (item) {
      this.addItem(item, source);
      return item;
    }
    return null;
  }

  public spawnEnergonCoin(
    baseZ: number,
    laneIndex?: number,
    xPos?: number,
    source: ItemSpawnSource = "segment",
  ) {
    const item = this.coinManager.spawnEnergon(
      baseZ,
      laneIndex,
      xPos,
      this.getSurfaceItemY(baseZ, laneIndex),
    ) as BaseItem;
    if (item) {
      this.addItem(item, source);
      return item;
    }
    return null;
  }

  public spawnGoldenCoin(
    baseZ: number,
    laneIndex?: number,
    xPos?: number,
    source: ItemSpawnSource = "segment",
  ) {
    const item = this.coinManager.spawnGolden(
      baseZ,
      laneIndex,
      xPos,
      this.getSurfaceItemY(baseZ, laneIndex),
    ) as BaseItem;
    if (item) {
      this.addItem(item, source);
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
        undefined,
        this.getSurfaceItemY(baseZ - i * spacing, laneIndex),
      ) as BaseItem;
      if (item) {
        this.addItem(item);
      }
    }
  }

  public spawnBooster(
    baseZ: number,
    laneIndex?: number,
    xPos?: number,
    allowedTypes?: ("nitro" | "shield" | "magnet" | "bullet")[],
    source: ItemSpawnSource = "segment",
  ) {
    if (allowedTypes && allowedTypes.length === 0) return null;

    const item = this.boosterManager.spawnRandom(
      baseZ,
      laneIndex,
      xPos,
      this.getSurfaceItemY(baseZ, laneIndex),
      allowedTypes,
    );
    if (item) {
      this.addItem(item, source);
      return item;
    }
    return null;
  }

  public spawnNitroBooster(
    baseZ: number,
    laneIndex?: number,
    xPos?: number,
    source: ItemSpawnSource = "segment",
  ) {
    const item = this.boosterManager.spawnNitro(
      baseZ,
      laneIndex,
      xPos,
      this.getSurfaceItemY(baseZ, laneIndex),
    );
    if (item) {
      this.addItem(item, source);
      return item;
    }
    return null;
  }

  public spawnMagnetBooster(
    baseZ: number,
    laneIndex?: number,
    xPos?: number,
    source: ItemSpawnSource = "segment",
  ) {
    const item = this.boosterManager.spawnMagnet(
      baseZ,
      laneIndex,
      xPos,
      this.getSurfaceItemY(baseZ, laneIndex),
    );
    if (item) {
      this.addItem(item, source);
      return item;
    }
    return null;
  }

  public spawnShieldBooster(
    baseZ: number,
    laneIndex?: number,
    xPos?: number,
    source: ItemSpawnSource = "segment",
  ) {
    const item = this.boosterManager.spawnShield(
      baseZ,
      laneIndex,
      xPos,
      this.getSurfaceItemY(baseZ, laneIndex),
    );
    if (item) {
      this.addItem(item, source);
      return item;
    }
    return null;
  }

  public spawnBulletItem(
    baseZ: number,
    laneIndex?: number,
    xPos?: number,
    source: ItemSpawnSource = "segment",
  ) {
    const item = this.boosterManager.spawnBullet(
      baseZ,
      laneIndex,
      xPos,
      this.getSurfaceItemY(baseZ, laneIndex),
    );
    if (item) {
      this.addItem(item, source);
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
    const groundY =
      this.getSurfaceItemY(jumpZ, lane) ?? useCommonStore().baseItemYpos;

    const trajectory = simulateJumpTrajectory({
      startY: useCommonStore().baseItemYpos,
      jumpHeight: usePlayerStore().JUMP_HEIGHT,
      gravity: useCommonStore().config.physics.gravity,
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
        groundY + (point.y - useCommonStore().baseItemYpos),
      ) as BaseItem;

      if (item) {
        item.userData.followSurface = false;
        this.addItem(item);
      }
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

  private spawnElevatedSectionsForSegment(
    segment: Segment,
    isReversed: boolean,
    baseZ: number,
    rowLength: number,
  ): void {
    const elevatedSections = segment.elevatedSections ?? [];
    if (elevatedSections.length === 0) return;

    const road = RoadManager.getInstance();
    const laneCount = useLevelStore().currentGameplay.laneCount;

    for (const section of elevatedSections) {
      const rowStart = Math.max(0, Math.min(section.rowStart, section.rowEnd));
      const rowEnd = Math.min(
        segment.pattern.length,
        Math.max(section.rowStart, section.rowEnd),
      );
      if (rowEnd <= rowStart) continue;

      road.spawnElevatedSection({
        lanes: this.resolveElevatedLanes(section, isReversed, laneCount),
        zStart: baseZ - rowEnd * rowLength + rowLength / 2,
        length: (rowEnd - rowStart) * rowLength,
        height: section.height,
        rampLength: Math.max(rowLength, section.rampRows * rowLength),
        rampIn: section.rampIn,
        rampOut: section.rampOut,
        color: this.colorToNumber(section.color),
        emissive: this.colorToNumber(section.emissiveColor),
        emissiveIntensity: section.emissiveIntensity,
        opacity: section.opacity,
      });
    }
  }

  private spawnRoadSurfaceForSegment(
    segment: Segment,
    isReversed: boolean,
    baseZ: number,
    rowLength: number,
  ): void {
    const laneCount = useLevelStore().currentGameplay.laneCount;
    const coverage = (segment.elevatedSections ?? []).map((section) => {
      const rowStart = Math.max(0, Math.min(section.rowStart, section.rowEnd));
      const rowEnd = Math.min(
        segment.pattern.length,
        Math.max(section.rowStart, section.rowEnd),
      );

      return {
        lanes: this.resolveElevatedLanes(section, isReversed, laneCount),
        rowStart,
        rowEnd,
      };
    });

    RoadManager.getInstance().spawnSegmentSurface(
      baseZ,
      rowLength,
      segment.pattern.length,
      coverage,
    );
  }

  private resolveElevatedLanes(
    section: SegmentElevatedSection,
    isReversed: boolean,
    laneCount: number,
  ): number[] {
    if (!isReversed) return section.lanes;
    return section.lanes.map((lane) => laneCount - 1 - lane);
  }

  private colorToNumber(color?: string): number | undefined {
    if (!color) return undefined;
    return Number.parseInt(color.replace("#", ""), 16);
  }

  private getSurfaceItemY(
    baseZ: number,
    laneIndex?: number,
  ): number | undefined {
    if (laneIndex === undefined) return undefined;

    return (
      useCommonStore().baseItemYpos +
      RoadManager.getInstance().getSurfaceHeightAt(laneIndex, baseZ)
    );
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
      this.magnetSystem.removeRepulseBeam(item);
      item.disposeCorruptedBoostMaterials();

      this.scene.remove(item);
    });
    this.items = [];

    this.segmentQueue.reset();

    this.worldFrontZ = useCommonStore().config.baseSegmentsZpos;
    this.nitroEnabledTimer = 0;
    this.magnetEnabledTimer = 0;
  }

  public addItem(item: BaseItem, source: ItemSpawnSource = "segment") {
    item.userData.spawnSource = source;
    this.applyCorruptedBoostRoll(item, source);
    this.items.push(item);
    this.scene.add(item);
  }

  private applyCorruptedBoostRoll(item: BaseItem, source: ItemSpawnSource) {
    if (!(item instanceof BoosterItem)) return;
    if (
      source === "drop" &&
      !useCommonStore().config.allowCorruptedBoostDrops
    ) {
      return;
    }

    const gameplay = useLevelStore().currentGameplay;
    const chance = gameplay.corruptedBoostChance;
    if (chance <= 0 || Math.random() > chance) return;

    if (item instanceof NitroItem) {
      this.markCorruptedBoost(
        item,
        this.pickWeightedCorruptedVariant(gameplay.corruptedBoostWeights.nitro),
      );
      return;
    }

    if (item instanceof ShieldItem) {
      this.markCorruptedBoost(
        item,
        this.pickWeightedCorruptedVariant(gameplay.corruptedBoostWeights.shield),
      );
      return;
    }

    if (item instanceof MagnetItem) {
      this.markCorruptedBoost(
        item,
        this.pickWeightedCorruptedVariant(gameplay.corruptedBoostWeights.magnet),
      );
    }
  }

  private pickWeightedCorruptedVariant<T extends CorruptedBoostVariant>(
    weights: Record<T, number>,
  ): T {
    const entries = Object.entries(weights) as [T, number][];
    const totalWeight = entries.reduce(
      (sum, [, weight]) => sum + Math.max(0, weight),
      0,
    );

    if (totalWeight <= 0) return entries[0][0];

    let roll = Math.random() * totalWeight;
    for (const [variant, weight] of entries) {
      roll -= Math.max(0, weight);
      if (roll <= 0) return variant;
    }

    return entries[entries.length - 1][0];
  }

  private markCorruptedBoost(item: BaseItem, variant: CorruptedBoostVariant) {
    item.userData.corruptedBoost = variant;
    item.userData.corruptedBoostPulse = {
      color: this.getCorruptedEmissionColor(variant),
      time: Math.random() * 1000,
    };
  }

  private getCorruptedEmissionColor(variant: CorruptedBoostVariant) {
    const colorByVariant: Record<CorruptedBoostVariant, number> = {
      heavyNitro: 0xff2a7a,
      lethalMagnet: 0xff1f1f,
      repulseMagnet: 0x28d7ff,
      blindShield: 0xf7fbff,
    };

    return colorByVariant[variant] ?? 0xff2a7a;
  }

  public removeItem(item: BaseItem) {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
    }

    const line = item.userData.magnetLine;
    if (line) this.scene.remove(line);
    this.magnetSystem.removeRepulseBeam(item);
    item.disposeCorruptedBoostMaterials();

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
