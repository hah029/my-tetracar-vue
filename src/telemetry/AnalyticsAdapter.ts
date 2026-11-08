import type { AnalyticsEvent } from "./analyticsEvents";

export interface AnalyticsAdapter {
  track(events: readonly AnalyticsEvent[]): Promise<void>;
}

export class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
  async track(events: readonly AnalyticsEvent[]): Promise<void> {
    if (!import.meta.env.DEV) return;
    console.debug("[telemetry:flush]", {
      count: events.length,
      types: events.map((event) => event.type),
    });
  }
}

/**
 * Локальный Vite middleware сохраняет NDJSON рядом с проектом. Адаптер
 * подключается только в DEV и никогда не попадает в production-поток.
 */
export class DevFileAnalyticsAdapter implements AnalyticsAdapter {
  private static readonly endpoint = "/__dev/telemetry-log";

  async track(events: readonly AnalyticsEvent[]): Promise<void> {
    await this.write("events", events);
  }

  private async write(kind: "events", payload: unknown): Promise<void> {
    if (!import.meta.env.DEV) return;

    const response = await fetch(DevFileAnalyticsAdapter.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, loggedAt: new Date().toISOString(), payload }),
    });
    if (!response.ok) throw new Error(`Dev telemetry log failed: ${response.status}`);
  }
}
