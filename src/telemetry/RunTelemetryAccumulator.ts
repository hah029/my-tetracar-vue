import type {
  DestroyMethod,
  ItemOutcomeStats,
  ItemType,
  ObstacleKind,
  RunStats,
  RunStatsBatch,
} from "./events";

function emptyStats(): RunStats {
  return {
    score: 0,
    distance: 0,
    itemsCollected: {},
    itemsRejected: {},
    itemOutcomes: {},
    shield: { activated: 0, armorAddedWhileActive: 0, hits: 0, breaks: 0, activeMs: 0 },
    jumps: { manualAttempts: 0, manualStarted: 0, rampStarted: 0, forcedLandings: 0 },
    combat: { shotsFired: 0, shotsHit: 0, shotsMissed: 0, shotsBlockedNoAmmo: 0, destroyedByObstacleKind: {} },
    jumpsCompleted: 0,
    obstaclesDestroyed: {},
  };
}

function cloneStats(stats: RunStats): RunStats {
  return {
    ...stats,
    itemsCollected: { ...stats.itemsCollected },
    itemsRejected: { ...stats.itemsRejected },
    itemOutcomes: Object.fromEntries(
      Object.entries(stats.itemOutcomes).map(([item, outcomes]) => [item, { ...outcomes }]),
    ),
    shield: { ...stats.shield },
    jumps: { ...stats.jumps },
    combat: {
      ...stats.combat,
      destroyedByObstacleKind: { ...stats.combat.destroyedByObstacleKind },
    },
    obstaclesDestroyed: { ...stats.obstaclesDestroyed },
  };
}

function subtractStats(current: RunStats, previous: RunStats): RunStats {
  const subtractMap = <T extends string>(
    target: Partial<Record<T, number>>,
    baseline: Partial<Record<T, number>>,
  ): Partial<Record<T, number>> =>
    Object.fromEntries(
      Object.keys(target)
        .map((key) => [key, Math.max(0, (target[key as T] ?? 0) - (baseline[key as T] ?? 0))])
        .filter(([, value]) => Number(value) > 0),
    ) as Partial<Record<T, number>>;

  return {
    score: Math.max(0, current.score - previous.score),
    distance: Math.max(0, current.distance - previous.distance),
    itemsCollected: subtractMap(current.itemsCollected, previous.itemsCollected),
    itemsRejected: subtractMap(current.itemsRejected, previous.itemsRejected),
    itemOutcomes: Object.fromEntries(
      Object.entries(current.itemOutcomes).map(([item, outcomes]) => {
        const baseline = previous.itemOutcomes[item as ItemType] ?? emptyItemOutcomes();
        return [item, subtractItemOutcomes(outcomes, baseline)];
      }),
    ),
    shield: subtractObject(current.shield, previous.shield),
    jumps: subtractObject(current.jumps, previous.jumps),
    combat: {
      shotsFired: Math.max(0, current.combat.shotsFired - previous.combat.shotsFired),
      shotsHit: Math.max(0, current.combat.shotsHit - previous.combat.shotsHit),
      shotsMissed: Math.max(0, current.combat.shotsMissed - previous.combat.shotsMissed),
      shotsBlockedNoAmmo: Math.max(
        0,
        current.combat.shotsBlockedNoAmmo - previous.combat.shotsBlockedNoAmmo,
      ),
      destroyedByObstacleKind: subtractMap(
        current.combat.destroyedByObstacleKind,
        previous.combat.destroyedByObstacleKind,
      ),
    },
    jumpsCompleted: Math.max(0, current.jumpsCompleted - previous.jumpsCompleted),
    obstaclesDestroyed: subtractMap(current.obstaclesDestroyed, previous.obstaclesDestroyed),
  };
}

function emptyItemOutcomes(): ItemOutcomeStats {
  return { spawned: 0, collected: 0, rejected: 0, expiredUncollected: 0 };
}

function subtractItemOutcomes(current: ItemOutcomeStats, previous: ItemOutcomeStats): ItemOutcomeStats {
  return subtractObject(current, previous);
}

function subtractObject<T extends Record<string, number>>(
  current: T,
  previous: T,
): T {
  return Object.fromEntries(
    Object.entries(current)
      .map(([key, value]) => [key, Math.max(0, value - (previous[key] ?? 0))]),
  ) as T;
}

function increment<T extends string>(target: Partial<Record<T, number>>, key: T, amount = 1): void {
  target[key] = (target[key] ?? 0) + amount;
}

export class RunTelemetryAccumulator {
  private totals = emptyStats();
  private lastCheckpoint = emptyStats();
  private sequence = 0;

  startRun(): void {
    this.totals = emptyStats();
    this.lastCheckpoint = emptyStats();
    this.sequence = 0;
  }

  recordItemCollected(item: ItemType, amount = 1): void {
    increment(this.totals.itemsCollected, item, amount);
    this.getItemOutcomes(item).collected += amount;
  }

  recordItemRejected(item: "ammo" | "armor"): void {
    increment(this.totals.itemsRejected, item);
    this.getItemOutcomes(item).rejected += 1;
  }

  recordItemSpawned(item: ItemType): void {
    this.getItemOutcomes(item).spawned += 1;
  }

  recordItemExpiredUncollected(item: ItemType): void {
    this.getItemOutcomes(item).expiredUncollected += 1;
  }

  recordJumpCompleted(): void {
    this.totals.jumpsCompleted += 1;
  }

  recordManualJumpAttempt(): void {
    this.totals.jumps.manualAttempts += 1;
  }

  recordManualJumpStarted(): void {
    this.totals.jumps.manualStarted += 1;
  }

  recordRampJumpStarted(): void {
    this.totals.jumps.rampStarted += 1;
    this.totals.jumpsCompleted += 1;
  }

  recordForcedLanding(): void {
    this.totals.jumps.forcedLandings += 1;
  }

  recordShieldActivated(): void {
    this.totals.shield.activated += 1;
  }

  recordArmorAddedWhileShieldActive(): void {
    this.totals.shield.armorAddedWhileActive += 1;
  }

  recordShieldHit(): void {
    this.totals.shield.hits += 1;
  }

  recordShieldBreak(): void {
    this.totals.shield.breaks += 1;
  }

  recordShieldActiveTime(deltaMs: number): void {
    this.totals.shield.activeMs += Math.max(0, deltaMs);
  }

  recordShotFired(): void {
    this.totals.combat.shotsFired += 1;
  }

  recordShotHit(): void {
    this.totals.combat.shotsHit += 1;
  }

  recordShotMissed(): void {
    this.totals.combat.shotsMissed += 1;
  }

  recordShotBlockedNoAmmo(): void {
    this.totals.combat.shotsBlockedNoAmmo += 1;
  }

  recordObstacleDestroyed(method: DestroyMethod, kind: ObstacleKind): void {
    increment(this.totals.obstaclesDestroyed, method);
    increment(this.totals.combat.destroyedByObstacleKind, kind);
  }

  flush(input: { score: number; distance: number }): RunStatsBatch {
    this.totals.score = Math.max(0, input.score);
    this.totals.distance = Math.max(0, input.distance);
    const totals = cloneStats(this.totals);
    const batch: RunStatsBatch = {
      sequence: ++this.sequence,
      totals,
      delta: subtractStats(totals, this.lastCheckpoint),
    };
    this.lastCheckpoint = cloneStats(totals);
    return batch;
  }

  private getItemOutcomes(item: ItemType): ItemOutcomeStats {
    return (this.totals.itemOutcomes[item] ??= emptyItemOutcomes());
  }
}

export const RunTelemetry = new RunTelemetryAccumulator();
