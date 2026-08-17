import { Telemetry } from "./Telemetry";
import type {
  DefeatCause,
  DestroyMethod,
  EventEnvelope,
  ItemType,
  RunFinishReason,
  RunStats,
} from "./events";

export type RunSummary = {
  runId: string;
  levelId: string;
  startedAt: string;
  durationMs: number;
  score: number;
  distance: number;
  itemsCollected: Partial<Record<ItemType, number>>;
  itemsRejected: Partial<Record<"ammo" | "armor", number>>;
  obstaclesDestroyed: Partial<Record<DestroyMethod, number>>;
  adsShown: number;
  finishReason: RunFinishReason;
  defeatCause?: DefeatCause;
  stats: RunStats;
};

type SummaryListener = (summary: RunSummary) => void;

type ActiveRun = Omit<
  RunSummary,
  "durationMs" | "score" | "distance" | "finishReason" | "stats"
>;

export class SessionStatsCollector {
  private activeRun: ActiveRun | null = null;
  private readonly listeners = new Set<SummaryListener>();

  constructor() {
    Telemetry.subscribe((event) => this.consume(event));
  }

  subscribe(listener: SummaryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private consume(event: EventEnvelope): void {
    switch (event.type) {
      case "run.started":
        if (!event.runId) return;
        this.activeRun = {
          runId: event.runId,
          levelId: event.levelId,
          startedAt: event.occurredAt,
          itemsCollected: {},
          itemsRejected: {},
          obstaclesDestroyed: {},
          adsShown: 0,
        };
        return;
      case "run.suspended":
        this.applyTotals(event.batch.totals);
        return;
      case "ad.opened":
        if (this.activeRun) this.activeRun.adsShown += 1;
        return;
      case "run.finished":
        this.finish(event);
        return;
    }
  }

  private finish(event: Extract<EventEnvelope, { type: "run.finished" }>): void {
    if (!this.activeRun || this.activeRun.runId !== event.runId) return;
    this.applyTotals(event.batch.totals);
    const summary: RunSummary = {
      ...this.activeRun,
      durationMs: event.durationMs,
      score: event.score,
      distance: event.distance,
      finishReason: event.reason,
      defeatCause: event.defeatCause,
      stats: event.batch.totals,
    };
    this.activeRun = null;
    for (const listener of this.listeners) listener(summary);
  }

  private applyTotals(totals: Pick<RunSummary, "itemsCollected" | "itemsRejected" | "obstaclesDestroyed"> & { distance?: number }): void {
    if (!this.activeRun) return;
    this.activeRun.itemsCollected = { ...totals.itemsCollected };
    this.activeRun.itemsRejected = { ...totals.itemsRejected };
    this.activeRun.obstaclesDestroyed = { ...totals.obstaclesDestroyed };
  }
}
