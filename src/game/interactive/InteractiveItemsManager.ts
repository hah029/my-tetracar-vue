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
import { SEGMENT_ROW_LENGTH } from "./segments/SegmentLibrary";

export class InteractiveItemsManager {
	private static instance: InteractiveItemsManager | null = null;
	private obstacleManager!: ObstacleManager;
	private coinManager!: CoinManager;
	private boosterManager!: BoosterManager;
	private bulletItemManager!: BulletItemManager;
	private segmentQueue!: SegmentQueue;
	// private nextSegmentZ = -60;
	private worldFrontZ = -60;
	private boosterEnabledTimer = 0;
	private boosterEnabledInterval = 5000;

	private DIAMOND_SPAWN_PROBABILITY = 0.005;
	private NITRO_SPAWN_PROBABILITY = 0.5;

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
		bulletItemManager: BulletItemManager
	) {
		this.obstacleManager = obstacleManager;
		this.coinManager = coinManager;
		this.boosterManager = boosterManager;
		this.bulletItemManager = bulletItemManager;
		this.segmentQueue = new SegmentQueue();
	}

	public update(deltaTime: number, speed: number, mode: UpdateMode) {
		// const spawnAhead = 90;

		// const distance = useProgressStore().getDistance();
		// const playerZ = -distance;
		// const minZ = playerZ - spawnAhead;

		this.ensureWorldFilled(deltaTime, speed);

		this.obstacleManager.update(deltaTime, speed);
		this.coinManager.update(deltaTime, speed);
		this.boosterManager.update(deltaTime, speed);
		this.bulletItemManager.update(deltaTime, speed);

		if (mode === UpdateMode.Destruction) return;

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

	private ensureWorldFilled(deltaTime: number, speed: number) {
		// 🚫 защита от спама за кадр
		const MAX_SPAWNS_PER_FRAME = 2;
		let spawned = 0;

		const minZ = -90;

		this.worldFrontZ += speed * deltaTime;

		// console.log("minZ, this.worldFrontZ", minZ, this.worldFrontZ);
		while (this.worldFrontZ > minZ && spawned < MAX_SPAWNS_PER_FRAME) {
			const length = this.spawnSegment(
				deltaTime,
				speed,
				this.worldFrontZ
			);
			this.worldFrontZ = this.worldFrontZ - length;
			spawned++;
		}
	}

	public spawnSegment(dt: number, speed: number, baseZ: number) {
		const segment = this.segmentQueue.getNext();

		const isReversed = segment.canReversed ? Math.random() < 0.5 : false;

		// console.log("baseZ", baseZ);

		segment.pattern.forEach((row, rowIndex) => {
			const z = baseZ - rowIndex * SEGMENT_ROW_LENGTH;

			let row_ = [...row];

			if (isReversed) {
				row_ = row_.reverse();
			}

			row_.forEach((value, lane) => {
				switch (value) {
					case LanePattern.Obstacle:
						this.obstacleManager.spawnStaticObstacle(lane, z, 2);
						break;

					case LanePattern.Jump:
						this.spawnJump(lane, dt, speed, z);
						break;
					case LanePattern.JumpCoins:
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

					case LanePattern.Nitro:
						this.spawnNitroBooster(lane, z);
						break;

					case LanePattern.Shield:
						this.spawnShieldBooster(lane, z);
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

		return segment.pattern.length * SEGMENT_ROW_LENGTH;
	}

	public spawnSingleCoin(lane: number, baseZ: number) {
		if (Math.random() < this.DIAMOND_SPAWN_PROBABILITY) {
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
		if (Math.random() < this.NITRO_SPAWN_PROBABILITY) {
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
		baseZ: number
	) {
		const jumpZ = baseZ + this.getJumpDistance(deltaTime, speed);
		this.obstacleManager.spawnJump(lane, jumpZ);

		const trajectory = simulateJumpTrajectory({
			startY: 0.5, // высота машины при прыжке
			jumpHeight: DEFAULT_CAR_CONFIG.jumpHeight,
			gravity: DEFAULT_CAR_CONFIG.gravity,
			deltaTime: deltaTime,
			forwardSpeed: speed,
		});

		const step = Math.max(1, Math.floor(trajectory.length / 10)); // больше монет
		for (let i = 0; i < trajectory.length; i += step) {
			const point = trajectory[i];
			if (point === undefined) continue;
			const coinZ = jumpZ + point.zOffset + 1;
			this.coinManager.spawnGold(lane, coinZ, point.y);
		}
	}

    public spawnJump(
		lane: number,
		deltaTime: number,
		speed: number,
		baseZ: number
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
		// this.nextSegmentZ = -60;
		this.worldFrontZ = -60;
		this.boosterEnabledTimer = 0;
	}
}
