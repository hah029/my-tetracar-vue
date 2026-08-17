function createId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

export class SessionManager {
  readonly sessionId = createId("session");
  private runId: string | undefined;
  private runStartedAt: number | undefined;
  private runStartedAtUnixMs: number | undefined;

  startRun(): string {
    this.runId = createId("run");
    this.runStartedAt = performance.now();
    this.runStartedAtUnixMs = Date.now();
    return this.runId;
  }

  getRunId(): string | undefined {
    return this.runId;
  }

  getRunDurationMs(): number {
    if (this.runStartedAt === undefined) return 0;
    return Math.max(0, Math.round(performance.now() - this.runStartedAt));
  }

  getRunStartedAtUnixMs(): number | undefined {
    return this.runStartedAtUnixMs;
  }

  finishRun(): void {
    this.runId = undefined;
    this.runStartedAt = undefined;
    this.runStartedAtUnixMs = undefined;
  }
}
