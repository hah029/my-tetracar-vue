import { APP_VERSION, BUILD_TIMESTAMP } from "@/generated/version";
import { SessionManager } from "./SessionManager";
import type {
  EventContext,
  EventEnvelope,
  RunStatsBatch,
  TelemetryEvent,
  TelemetryIdentity,
  TelemetryPlatform,
} from "./events";

const ANONYMOUS_ID_KEY = "telemetry.anonymousInstallId.v1";
const ACTIVE_RUN_KEY = "telemetry.activeRun.v1";

type TelemetryConfig = {
  platform: TelemetryPlatform;
  locale: string;
  identity?: TelemetryIdentity;
};

type Listener = (event: EventEnvelope) => void;

function emptyRunStats(): RunStatsBatch["totals"] {
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

function isRunStatsBatch(value: unknown): value is RunStatsBatch {
  if (!value || typeof value !== "object") return false;
  const batch = value as Partial<RunStatsBatch>;
  return (
    typeof batch.sequence === "number" &&
    !!batch.totals &&
    typeof batch.totals.score === "number" &&
    typeof batch.totals.distance === "number" &&
    !!batch.delta
  );
}

function withZeroDelta(batch: RunStatsBatch): RunStatsBatch {
  return {
    ...batch,
    delta: emptyRunStats(),
  };
}

type ActiveRunCheckpoint = {
  runId: string;
  startedAtUnixMs: number;
  levelId?: string;
  difficultyId?: string;
  batch: RunStatsBatch;
  durationMs: number;
};

function createAnonymousIdentity(): TelemetryIdentity {
  const existing = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (existing) return { kind: "anonymous", id: existing };

  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(ANONYMOUS_ID_KEY, id);
  return { kind: "anonymous", id };
}

export class TelemetryService {
  private readonly session = new SessionManager();
  private readonly listeners = new Set<Listener>();
  private platform: TelemetryPlatform = "local";
  private locale = "en";
  private identity = createAnonymousIdentity();
  private initialized = false;
  private recoveredRun: ActiveRunCheckpoint | null = null;

  initialize(config: TelemetryConfig): void {
    this.platform = config.platform;
    this.locale = config.locale;
    this.identity = config.identity ?? createAnonymousIdentity();
    this.recoveredRun = this.restoreActiveRunCheckpoint();
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getSessionId(): string {
    return this.session.sessionId;
  }

  getRunId(): string | undefined {
    return this.session.getRunId();
  }

  startRun(metadata: { levelId?: string; difficultyId?: string } = {}): string {
    const runId = this.session.startRun();
    this.persistActiveRunCheckpoint({
      runId,
      startedAtUnixMs: this.session.getRunStartedAtUnixMs() ?? Date.now(),
      levelId: metadata.levelId,
      difficultyId: metadata.difficultyId,
      batch: {
        sequence: 0,
        totals: emptyRunStats(),
        delta: emptyRunStats(),
      },
      durationMs: 0,
    });
    return runId;
  }

  getRunDurationMs(): number {
    return this.session.getRunDurationMs();
  }

  finishRun(): void {
    this.session.finishRun();
    localStorage.removeItem(ACTIVE_RUN_KEY);
  }

  suspendRun(payload: {
    reason: "manual_pause" | "page_hidden";
    batch: RunStatsBatch;
  }): void {
    if (!this.session.getRunId()) return;
    const durationMs = this.getRunDurationMs();
    const current = this.readCurrentActiveRunCheckpoint();
    if (current) {
      this.persistActiveRunCheckpoint({
        ...current,
        // Этот checkpoint уже учтён subscribers в текущем процессе. При
        // следующем запуске восстанавливаем totals, но не повторяем delta.
        batch: withZeroDelta(payload.batch),
        durationMs,
      });
    }
    this.emit({ type: "run.suspended", ...payload, durationMs });
  }

  resumeRun(): void {
    if (!this.session.getRunId()) return;
    this.emit({ type: "run.resumed", reason: "manual_resume" });
  }

  recoverAbandonedRun(): void {
    if (!this.recoveredRun) return;
    const run = this.recoveredRun;
    this.recoveredRun = null;
    localStorage.removeItem(ACTIVE_RUN_KEY);
    this.emit({
      type: "run.abandoned",
      previousRunId: run.runId,
      levelId: run.levelId,
      batch: run.batch,
      durationMs: run.durationMs,
      reason: "unrecovered_previous_run",
    });
  }

  setIdentity(identity: TelemetryIdentity): void {
    if (identity.kind === this.identity.kind && identity.id === this.identity.id) return;
    const previousIdentity = this.identity;
    this.identity = identity;
    this.emit({ type: "identity.linked", previousIdentity, nextIdentity: identity });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit<T extends TelemetryEvent>(event: T): EventEnvelope<T> {
    const envelope = { ...event, ...this.createContext() } as EventEnvelope<T>;
    for (const listener of this.listeners) {
      try {
        listener(envelope);
      } catch (error) {
        console.error("[telemetry] listener error", error);
      }
    }
    return envelope;
  }

  private createContext(): EventContext {
    return {
      eventId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      occurredAt: new Date().toISOString(),
      sessionId: this.session.sessionId,
      runId: this.session.getRunId(),
      identity: this.identity,
      platform: this.platform,
      appVersion: APP_VERSION,
      buildTimestamp: BUILD_TIMESTAMP,
      locale: this.locale,
    };
  }

  private restoreActiveRunCheckpoint(): ActiveRunCheckpoint | null {
    try {
      const raw = localStorage.getItem(ACTIVE_RUN_KEY);
      if (!raw) return null;
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== "object") return null;
      const run = value as Partial<ActiveRunCheckpoint>;
      if (typeof run.runId !== "string" || typeof run.startedAtUnixMs !== "number") return null;
      return {
        runId: run.runId,
        startedAtUnixMs: run.startedAtUnixMs,
        levelId: typeof run.levelId === "string" ? run.levelId : undefined,
        difficultyId: typeof run.difficultyId === "string" ? run.difficultyId : undefined,
        batch: isRunStatsBatch(run.batch)
          ? run.batch
          : { sequence: 0, totals: emptyRunStats(), delta: emptyRunStats() },
        durationMs: Number(run.durationMs) || 0,
      };
    } catch {
      return null;
    }
  }

  private readCurrentActiveRunCheckpoint(): ActiveRunCheckpoint | null {
    return this.restoreActiveRunCheckpoint();
  }

  private persistActiveRunCheckpoint(checkpoint: ActiveRunCheckpoint): void {
    localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(checkpoint));
  }
}

export const Telemetry = new TelemetryService();
