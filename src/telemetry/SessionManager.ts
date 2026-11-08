function createId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

export class SessionManager {
  readonly sessionId = createId("session");
  private runId: string | undefined;
  private runStartedAt: number | undefined;
  private activeMs = 0;
  private runStartedAtUnixMs: number | undefined;

  constructor(private readonly now: () => number = () => performance.now()) {}

  startRun(paused = false): string {
    this.runId = createId("run");
    this.activeMs = 0;
    this.runStartedAt = paused ? undefined : this.now();
    this.runStartedAtUnixMs = Date.now();
    return this.runId;
  }

  getRunId(): string | undefined {
    return this.runId;
  }

  getRunDurationMs(): number {
    return Math.max(0, Math.round(this.activeMs +
      (this.runStartedAt === undefined ? 0 : this.now() - this.runStartedAt)));
  }

  pauseRun(): void {
    if (this.runStartedAt === undefined) return;
    this.activeMs += this.now() - this.runStartedAt;
    this.runStartedAt = undefined;
  }

  resumeRun(): void {
    if (this.runId && this.runStartedAt === undefined) this.runStartedAt = this.now();
  }

  getRunStartedAtUnixMs(): number | undefined {
    return this.runStartedAtUnixMs;
  }

  finishRun(): void {
    this.activeMs = 0;
    this.runId = undefined;
    this.runStartedAt = undefined;
    this.runStartedAtUnixMs = undefined;
  }
}
