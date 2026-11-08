import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { createRequire } from 'node:module';

const result = await build({
  stdin: { contents: `export { useDailyGiftStore } from './src/store/dailyGiftStore';
    export { DAILY_GIFT_RECOVERY, DAILY_GIFT_CYCLE_LENGTH, canDoubleDailyGift } from './src/configs/dailyGift';
    export { createPinia, setActivePinia } from 'pinia';`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', tsconfig: 'tsconfig.app.json',
  plugins: [{ name: 'daily-mocks', setup(builder) {
    const mocks = {
      "@/telemetry/Telemetry": "export const Telemetry = { emit: event => globalThis.dailyTest.events.push(event) };",
      '@/sdk/Platform': 'export const Platform = { getInstance: () => globalThis.dailyTest.platform };',
      '@/store/metaStore': 'export const useMetaStore = () => globalThis.dailyTest.meta;',
      '@/store/progressStore': 'export const useProgressStore = () => ({ saveProgress: async () => {} });',
      '@/sdk/PlatformAds': 'export const PlatformAds = { showRewarded: async (_, onRewarded) => globalThis.dailyTest.ad(onRewarded) };',
      '@/purchase/RewardProcessor': 'export const RewardProcessor = { resolve: reward => reward, applyAll: async rewards => { globalThis.dailyTest.rewards.push(rewards); return rewards.map(reward => ({ type: reward.type, amount: reward.effect.amount, currency: reward.effect.currency, compensated: false })); } };',
    };
    builder.onResolve({ filter: /^@\// }, args => args.path in mocks ? { path: args.path, namespace: 'mock' } : undefined);
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents: mocks[args.path] }));
  } }],
});
const bundled = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), bundled, bundled.exports);
const { useDailyGiftStore, createPinia, setActivePinia, DAILY_GIFT_RECOVERY, DAILY_GIFT_CYCLE_LENGTH, canDoubleDailyGift } = bundled.exports;
function dateAgo(days) { return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10); }
async function setup(day = 10, missed = 1, balance = 20) {
  const state = {
    saved: { version: 1, cycleNumber: 1, totalClaims: day, lastClaimedDay: day, lastClaimedUtcDay: dateAgo(missed + 1) },
    ad: async onRewarded => { onRewarded(); return { status: "closed" }; },
    meta: { energons: balance }, balance, debits: 0, rewards: [], events: [], failWrite: 0, writes: 0, failDebit: false, gate: null,
  };
  state.platform = {
    getPlayerDataByKey: async () => JSON.stringify(state.saved),
    setPlayerDataByKey: async (_, raw) => {
      state.writes++;
      if (state.gate) await state.gate;
      if (state.writes === state.failWrite) throw new Error('data failed');
      state.saved = JSON.parse(raw);
    },
    getPlayerStatByKey: async () => state.balance,
    setPlayerStatByKey: async (_, value) => {
      if (state.failDebit) throw new Error('debit failed');
      state.debits++;
      state.balance = value;
    },
  };
  globalThis.dailyTest = state;
  setActivePinia(createPinia());
  const store = useDailyGiftStore();
  await store.restore();
  return { store, state };
}
async function withoutErrorLogs(action) {
  const original = console.error;
  console.error = () => {};
  try { return await action(); } finally { console.error = original; }
}

test('full 28-day progression, week transitions and cycle rollover', async () => {
  assert.equal(DAILY_GIFT_CYCLE_LENGTH, 28);
  for (const day of [7, 14, 21, 27, 28]) {
    const { store } = await setup(day, 0);
    assert.equal(store.status.day, day === 28 ? 1 : day + 1);
    assert.equal(store.status.cycleNumber, day === 28 ? 2 : 1);
  }
});

test('recovery rolls back within the last claimed week, including its final day', async () => {
  for (const [day, expected] of [[1, 1], [7, 1], [8, 8], [14, 8], [15, 15], [21, 15], [22, 22], [28, 22]]) {
    const { store } = await setup(day);
    assert.equal(store.recovery.day, expected);
    assert.equal(store.recovery.available, expected > 1);
  }
});

test('eligibility respects missed-day limits, disabled config and balance', async () => {
  for (const [missed, available] of [[0, false], [1, true], [3, true], [4, false]]) {
    const { store } = await setup(10, missed);
    assert.equal(store.recovery.available, available);
  }
  const { store, state } = await setup(10, 1, 4);
  assert.equal(await store.recover(), false);
  assert.equal(state.debits, 0);
  DAILY_GIFT_RECOVERY.enabled = false;
  try { assert.equal((await setup()).store.recovery.available, false); }
  finally { DAILY_GIFT_RECOVERY.enabled = true; }
});

test('recovery charges once, preserves claims and allows the week-start reward today', async () => {
  const { store, state } = await setup();
  assert.equal(await store.recover(), true);
  assert.equal(state.balance, 15);
  assert.equal(store.state.totalClaims, 10);
  assert.equal(store.status.day, 8);
  assert.equal(state.rewards.length, 0);
  assert.equal(await store.recover(), false);
  assert.equal(await store.claim(), true);
  assert.equal(store.state.lastClaimedDay, 8);
  assert.equal(store.state.totalClaims, 11);
  assert.equal(await store.claim(), false);
});

test('free restart discards the old recovery offer without a payment', async () => {
  const { store, state } = await setup();
  assert.equal(await store.claim(), true);
  assert.equal(store.state.lastClaimedDay, 1);
  assert.equal(store.recovery.available, false);
  assert.equal(state.balance, 20);
});

test('failed payment intent saves do not debit; concurrent actions are blocked', async () => {
  const { store, state } = await setup();
  let release;
  state.gate = new Promise(resolve => { release = resolve; });
  state.failWrite = 1;
  const operation = store.recover();
  assert.equal(await store.recover(), false);
  assert.equal(await store.claim(), false);
  release();
  assert.equal(await withoutErrorLogs(() => operation), false);
  assert.equal(state.balance, 20);
  assert.equal(state.debits, 0);
  assert.equal(store.state.pendingRecovery, undefined);
});

test('reload resumes an already debited recovery without charging twice', async () => {
  const { store, state } = await setup();
  state.failWrite = 2;
  assert.equal(await withoutErrorLogs(() => store.recover()), false);
  assert.equal(state.balance, 15);
  assert.ok(state.saved.pendingRecovery);
  assert.equal(await store.claim(), false);
  setActivePinia(createPinia());
  const restored = useDailyGiftStore();
  await restored.restore();
  assert.equal(restored.status.day, 8);
  assert.equal(state.debits, 1);
  assert.equal(state.saved.pendingRecovery, undefined);
});

test('failed debit can be retried without granting free recovery', async () => {
  const { store, state } = await setup();
  state.failDebit = true;
  assert.equal(await withoutErrorLogs(() => store.recover()), false);
  assert.equal(state.balance, 20);
  assert.equal(store.status.day, 1);
  state.failDebit = false;
  assert.equal(await store.recover(), true);
  assert.equal(state.balance, 15);
  assert.equal(state.debits, 1);
});

test('restoration survives reload and an unclaimed restored day counts as a missed day', async () => {
  const { store, state } = await setup(20);
  assert.equal(await store.recover(), true);
  setActivePinia(createPinia());
  const restored = useDailyGiftStore();
  await restored.restore();
  assert.equal(restored.status.day, 15);
  state.saved.recovered.utcDay = dateAgo(1);
  await restored.restore();
  assert.equal(restored.status.day, 1);
  assert.equal(restored.recovery.missedDays, 1);
  assert.equal(restored.recovery.day, 15);
});

test('configured price and minimum missed days apply to new purchases', async () => {
  const original = { ...DAILY_GIFT_RECOVERY };
  Object.assign(DAILY_GIFT_RECOVERY, { minMissedDays: 2, maxMissedDays: 5, energonCost: 9 });
  try {
    assert.equal((await setup(10, 1)).store.recovery.available, false);
    const { store, state } = await setup(10, 5);
    assert.equal(await store.recover(), true);
    assert.equal(state.balance, 11);
  } finally { Object.assign(DAILY_GIFT_RECOVERY, original); }
});

test('double rewards are available exactly on days 1, 3 and 6 of all four weeks', () => {
  const eligible = Array.from({ length: 28 }, (_, i) => i + 1).filter(canDoubleDailyGift);
  assert.deepEqual(eligible, [1, 3, 6, 8, 10, 13, 15, 17, 20, 22, 24, 27]);
});

test('rewarded viewing doubles both currencies once and preserves config rewards', async () => {
  const { store, state } = await setup(7, 0);
  const amounts = store.currentRewards.map(r => r.effect.amount);
  state.ad = async onRewarded => { onRewarded(); onRewarded(); return { status: 'closed' }; };
  assert.equal(await store.claim(true), true);
  assert.deepEqual(state.rewards[0].map(r => r.effect.amount), amounts.map(v => v * 2));
  assert.deepEqual(store.currentRewards.map(r => r.effect.amount), amounts);
  assert.equal(state.rewards.length, 1);
  assert.equal(await store.claim(true), false);
});

test('closed, failed or throwing ads grant nothing and allow a normal claim', async () => {
  for (const mode of ['closed', 'failed', 'throw']) {
    const { store, state } = await setup(2, 0);
    state.ad = async () => { if (mode === 'throw') throw new Error('ad failed'); return { status: mode }; };
    assert.equal(await withoutErrorLogs(() => store.claim(true)), false);
    assert.equal(state.rewards.length, 0);
    assert.equal(store.status.canClaim, true);
    assert.equal(await store.claim(), true);
    assert.equal(state.rewards[0][0].effect.amount, 500);
  }
});

test('ad viewing locks claims and recovery; unsupported days cannot start an ad', async () => {
  const blocked = await setup(1, 0);
  blocked.state.ad = async () => { throw new Error('must not run'); };
  assert.equal(await blocked.store.claim(true), false);
  const { store, state } = await setup(2, 0);
  let finish;
  state.ad = async onRewarded => new Promise(resolve => { finish = () => { onRewarded(); resolve({ status: 'closed' }); }; });
  const claim = store.claim(true);
  assert.equal(store.isWatchingAd, true);
  assert.equal(await store.claim(), false);
  assert.equal(await store.claim(true), false);
  assert.equal(await store.recover(), false);
  finish();
  assert.equal(await claim, true);
});

test('daily telemetry records one grant with doubled amounts and ad outcome', async () => {
  const { store, state } = await setup(7, 0);
  await store.claim(true);
  const grants = state.events.filter(event => event.type === 'reward.claimed');
  assert.equal(grants.length, 1);
  assert.equal(grants[0].source, 'daily_gift');
  assert.equal(grants[0].rewardId, '8');
  assert.equal(grants[0].multiplier, 2);
  assert.deepEqual(grants[0].rewards.map(reward => reward.amount), [1000, 4]);
  assert.equal(state.events.filter(event => event.type === 'ad.rewarded').length, 1);
});
