import type { AnalyticsAdapter } from "./AnalyticsAdapter";
import type { RunSummary, SessionStatsCollector } from "./SessionStatsCollector";
import { Telemetry } from "./Telemetry";
import type { EventEnvelope } from "./events";

const QUEUE_KEY = "telemetry.queue.v1";
const MAX_QUEUE_SIZE = 500;
const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 30_000;

function restoreQueue(): EventEnvelope[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? (value as EventEnvelope[]) : [];
  } catch {
    return [];
  }
}

export class AnalyticsReporter {
  private queue = restoreQueue();
  private flushPromise: Promise<void> | null = null;
  private readonly unsubscribe: () => void;
  private readonly intervalId: number;

  constructor(private readonly adapters: readonly AnalyticsAdapter[]) {
    this.unsubscribe = Telemetry.subscribe((event) => this.enqueue(event));
    this.intervalId = window.setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
  }

  attachSessionStats(collector: SessionStatsCollector): void {
    collector.subscribe((summary) => void this.reportRunSummary(summary));
  }

  async flush(): Promise<void> {
    if (this.flushPromise) return this.flushPromise;
    this.flushPromise = this.flushQueue().finally(() => {
      this.flushPromise = null;
    });
    return this.flushPromise;
  }

  dispose(): void {
    this.unsubscribe();
    window.clearInterval(this.intervalId);
  }

  private enqueue(event: EventEnvelope): void {
    this.queue.push(event);
    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue.splice(0, this.queue.length - MAX_QUEUE_SIZE);
    }
    this.persistQueue();

    if (
      event.type === "run.finished" ||
      event.type === "run.suspended" ||
      event.type === "run.abandoned" ||
      event.type === "app.backgrounded" ||
      event.type === "ad.closed" ||
      event.type === "ad.failed" ||
      event.type === "ad.suppressed"
    ) {
      void this.flush();
    }
  }

  private async flushQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const isSent = await this.flushNextBatch();
      if (!isSent) return;
    }
  }

  private async flushNextBatch(): Promise<boolean> {
    const batch = this.queue.slice(0, BATCH_SIZE);
    if (batch.length === 0 || this.adapters.length === 0) return false;

    try {
      await Promise.all(this.adapters.map((adapter) => adapter.track(batch)));
      this.queue.splice(0, batch.length);
      this.persistQueue();
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.warn("[telemetry] analytics flush failed", error);
      return false;
    }
  }

  private async reportRunSummary(summary: RunSummary): Promise<void> {
    try {
      await Promise.all(
        this.adapters
          .filter((adapter) => adapter.trackRunSummary)
          .map((adapter) => adapter.trackRunSummary!(summary)),
      );
    } catch (error) {
      if (import.meta.env.DEV) console.warn("[telemetry] run summary delivery failed", error);
    }
  }

  private persistQueue(): void {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      if (import.meta.env.DEV) console.warn("[telemetry] queue persistence failed", error);
    }
  }
}
