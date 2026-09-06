import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { createRequire } from 'node:module';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
globalThis.window = { setInterval: () => 1, clearInterval: () => {} };
const result = await build({
  stdin: { contents: `export { Telemetry, TelemetryService } from './src/telemetry/Telemetry';
    export { AnalyticsReporter } from './src/telemetry/AnalyticsReporter';
    export { RunTelemetryAccumulator } from './src/telemetry/RunTelemetryAccumulator';
    export { SessionManager } from './src/telemetry/SessionManager';
    export { toAnalyticsEvent } from './src/telemetry/analyticsEvents';`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', tsconfig: 'tsconfig.app.json',
  define: { 'import.meta.env.DEV': 'false' },
});
const bundled = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), bundled, bundled.exports);
const { Telemetry, TelemetryService, AnalyticsReporter, RunTelemetryAccumulator, SessionManager, toAnalyticsEvent } = bundled.exports;
function envelope(payload) { return Telemetry.emit(payload); }
function finished() {
  const accumulator = new RunTelemetryAccumulator();
  accumulator.recordItemSpawned('golden');
  accumulator.recordItemCollected('golden', 5);
  return envelope({ type: 'run.finished', reason: 'crash', score: 50, distance: 10,
    batch: accumulator.flush({ score: 50, distance: 10 }), durationMs: 1000, isNewRecord: false });
}

test('run export contains one snapshot and retains identity without duplicate payloads', () => {
  const raw = finished();
  const projected = toAnalyticsEvent(raw);
  assert.equal(projected.type, 'run.ended');
  assert.equal(projected.schemaVersion, 2);
  assert.equal(projected.eventId, raw.eventId);
  assert.equal(projected.stats.score, 50);
  for (const key of ['batch', 'score', 'distance', 'buildTimestamp', 'locale']) assert.equal(key in projected, false);
  assert.ok(JSON.stringify(projected).length < JSON.stringify(raw).length);
  assert.ok(raw.batch.delta); // Internal objectives still receive their deltas.
});

test('pickup count is distinct from currency value and deltas remain correct', () => {
  const accumulator = new RunTelemetryAccumulator();
  accumulator.recordItemCollected('golden', 5);
  const first = accumulator.flush({ score: 1, distance: 3 });
  assert.equal(first.totals.itemsCollected.golden, 5);
  assert.equal(first.totals.itemOutcomes.golden.collected, 1);
  const second = accumulator.flush({ score: 1, distance: 3 });
  assert.equal(second.delta.itemsCollected.golden, undefined);
  assert.equal(second.delta.itemOutcomes.golden.collected, 0);
});

test('redundant UI clicks are filtered; screen views and bounded errors remain', () => {
  assert.equal(toAnalyticsEvent(envelope({ type: 'ui.action', name: 'shop_opened', screen: 'menu' })), null);
  const view = toAnalyticsEvent(envelope({ type: 'ui.overlay_opened', overlay: 'shop' }));
  assert.equal(view.type, 'navigation.viewed');
  assert.equal(view.screen, 'shop');
  const failed = toAnalyticsEvent(envelope({ type: 'ad.failed', placement: 'daily_gift_double', format: 'rewarded', reason: 'raw SDK message with arbitrary details' }));
  assert.equal(failed.reason, 'provider_error');
  assert.equal(toAnalyticsEvent(envelope({ type: 'economy.purchase_failed', productId: 'ammo', reason: 'Not enough currency' })).reason, 'insufficient_funds');
});

test('abandoned runs retain the original run ID and are marked incomplete', () => {
  const raw = finished();
  const projected = toAnalyticsEvent(envelope({ type: 'run.abandoned', previousRunId: 'old-run', batch: raw.batch, durationMs: 10, reason: 'unrecovered_previous_run' }));
  assert.equal(projected.runId, 'old-run');
  assert.equal(projected.incomplete, true);
});

test('active duration excludes countdown and pause, including repeated suspend calls', () => {
  let now = 0;
  const session = new SessionManager(() => now);
  session.startRun(true);
  now = 3000;
  assert.equal(session.getRunDurationMs(), 0);
  session.resumeRun();
  now = 5000;
  session.pauseRun();
  now = 25000;
  session.pauseRun();
  assert.equal(session.getRunDurationMs(), 2000);
  session.resumeRun();
  now = 26000;
  assert.equal(session.getRunDurationMs(), 3000);
  session.finishRun();
  assert.equal(session.getRunDurationMs(), 0);
});

test('failed delivery retries with identical IDs, and does not leak a summary stream', async () => {
  storage.delete('telemetry.queue.v2');
  const batches = [];
  let fail = true;
  const reporter = new AnalyticsReporter([{ track: async events => { batches.push(events); if (fail) throw Error('offline'); } }]);
  envelope({ type: 'app.ready' });
  await reporter.flush();
  assert.equal(JSON.parse(storage.get('telemetry.queue.v2')).length, 1);
  fail = false;
  await reporter.flush();
  assert.equal(batches[0][0].eventId, batches[1][0].eventId);
  assert.deepEqual(JSON.parse(storage.get('telemetry.queue.v2')), []);
  reporter.dispose();
});

test('queue overflow during delivery cannot delete newer unsent events', async () => {
  storage.delete('telemetry.queue.v2');
  let release;
  const sent = [];
  const reporter = new AnalyticsReporter([{ track: async events => {
    sent.push(...events);
    if (sent.length === 1) await new Promise(resolve => { release = resolve; });
  } }]);
  envelope({ type: 'app.ready' });
  const flushing = reporter.flush();
  const ids = [];
  for (let index = 0; index < 505; index++) ids.push(envelope({ type: 'app.ready' }).eventId);
  release();
  await flushing;
  assert.deepEqual(sent.slice(1).map(event => event.eventId), ids.slice(-500));
  reporter.dispose();
});

test('no configured adapter means no collection queue', async () => {
  storage.delete('telemetry.queue.v2');
  const reporter = new AnalyticsReporter([]);
  envelope({ type: 'app.ready' });
  assert.equal(storage.has('telemetry.queue.v2'), false);
  reporter.dispose();
});
