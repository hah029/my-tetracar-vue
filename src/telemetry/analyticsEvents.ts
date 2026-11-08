import type { EventContext, EventEnvelope, RunStats, TelemetryEvent } from "./events";

/** Export contract. Internal gameplay events are intentionally richer. */
export type AnalyticsContext = Omit<EventContext, "buildTimestamp" | "locale"> & { schemaVersion: 2 };
export type AnalyticsRunStats = {
  score: number;
  distance: number;
  currencyCollected: { golden: number; energon: number };
  pickups: RunStats["itemOutcomes"];
  obstaclesDestroyed: RunStats["obstaclesDestroyed"];
  shots: Pick<RunStats["combat"], "shotsFired" | "shotsHit" | "shotsBlockedNoAmmo">;
  shield: Pick<RunStats["shield"], "hits" | "breaks" | "activeMs">;
  jumps: Pick<RunStats["jumps"], "manualStarted" | "rampStarted">;
};
type ForwardedEvent = Extract<TelemetryEvent, { type:
  | "app.ready" | "run.started" | "run.resumed"
  | "economy.purchase_started" | "economy.purchase_completed" | "economy.purchase_failed"
  | "reward.claimed" | "reward.failed" | "daily.recovered" | "daily.recovery_failed"
  | "ad.requested" | "ad.opened" | "ad.closed" | "ad.failed" | "ad.suppressed" | "ad.rewarded"
}>;
export type AnalyticsEvent = AnalyticsContext & (
  | ForwardedEvent
  | { type: "app.opened"; launchType: "cold" | "restored"; locale: string }
  | { type: "app.backgrounded" | "app.foregrounded" }
  | { type: "identity.linked"; previousIdentity: EventContext["identity"] }
  | { type: "navigation.viewed"; screen: string; from?: string; section?: string }
  | { type: "run.checkpoint"; reason: string; sequence: number; durationMs: number; stats: AnalyticsRunStats }
  | { type: "run.ended"; reason: string; defeatCause?: string; sequence: number; durationMs: number;
      stats: AnalyticsRunStats; isNewRecord?: boolean; incomplete: boolean; levelId?: string }
);

function runStats(stats: RunStats): AnalyticsRunStats {
  return {
    score: stats.score, distance: stats.distance,
    currencyCollected: { golden: stats.itemsCollected.golden ?? 0, energon: stats.itemsCollected.energon ?? 0 },
    pickups: stats.itemOutcomes,
    obstaclesDestroyed: stats.obstaclesDestroyed,
    shots: { shotsFired: stats.combat.shotsFired, shotsHit: stats.combat.shotsHit, shotsBlockedNoAmmo: stats.combat.shotsBlockedNoAmmo },
    shield: { hits: stats.shield.hits, breaks: stats.shield.breaks, activeMs: Math.round(stats.shield.activeMs) },
    jumps: { manualStarted: stats.jumps.manualStarted, rampStarted: stats.jumps.rampStarted },
  };
}

// Export bounded codes, never arbitrary SDK exception messages.
function failureCode(reason: string): string {
  if (reason === "Not enough currency") return "insufficient_funds";
  const codes = ["callback_timeout", "ad_already_showing", "ads_disabled_by_purchase", "policy",
    "unavailable", "already_owned", "max_level", "max_fill", "insufficient_funds", "claim_failed", "spin_failed",
    "reward_failed", "recovery_failed", "ad_not_completed", "ad_failed", "purchase_failed"];
  return codes.includes(reason) ? reason : "provider_error";
}

export function toAnalyticsEvent(event: EventEnvelope): AnalyticsEvent | null {
  const { eventId, occurredAt, sessionId, runId, identity, platform, appVersion,
    buildTimestamp: _build, locale, ...payload } = event;
  const context: AnalyticsContext = { schemaVersion: 2, eventId, occurredAt, sessionId, runId, identity, platform, appVersion };
  switch (payload.type) {
    case "ui.action":
    case "ui.overlay_closed": return null;
    case "ui.overlay_opened": return { ...context, type: "navigation.viewed", screen: payload.overlay, section: payload.section };
    case "navigation.state_changed": return { ...context, type: "navigation.viewed", screen: payload.to, from: payload.from };
    case "app.opened": return { ...context, ...payload, locale };
    case "app.backgrounded":
    case "app.foregrounded": return { ...context, type: payload.type };
    case "identity.linked": return { ...context, type: payload.type, previousIdentity: payload.previousIdentity };
    case "run.suspended": return { ...context, type: "run.checkpoint", reason: payload.reason,
      sequence: payload.batch.sequence, durationMs: payload.durationMs, stats: runStats(payload.batch.totals) };
    case "run.finished": return { ...context, type: "run.ended", reason: payload.reason, defeatCause: payload.defeatCause,
      sequence: payload.batch.sequence, durationMs: payload.durationMs, stats: runStats(payload.batch.totals),
      isNewRecord: payload.isNewRecord, incomplete: false };
    case "run.abandoned": return { ...context, runId: payload.previousRunId, type: "run.ended", reason: "abandoned",
      levelId: payload.levelId, sequence: payload.batch.sequence, durationMs: payload.durationMs,
      stats: runStats(payload.batch.totals), incomplete: true };
    case "ad.failed":
    case "economy.purchase_failed":
    case "reward.failed":
    case "daily.recovery_failed": return { ...context, ...payload, reason: failureCode(payload.reason) };
    default: return { ...context, ...payload };
  }
}
