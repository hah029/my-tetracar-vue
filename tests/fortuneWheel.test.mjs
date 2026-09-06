import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { createRequire } from 'node:module';

// Bundle the real stores with only platform/game side effects replaced.
const result = await build({
  stdin: { contents: `export { useMetaStore } from './src/store/metaStore';
    export { useFortuneWheelStore } from './src/store/fortuneWheelStore';
    export { createPinia, setActivePinia } from 'pinia';`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', tsconfig: 'tsconfig.app.json',
  define: { 'import.meta.env.DEV': 'false' },
  plugins: [{ name: 'game-mocks', setup(builder) {
    const mocks = {
      "@/telemetry/Telemetry": "export const Telemetry = { emit: () => {} };",
      '@/sdk/Platform': 'export const Platform = { getInstance: () => globalThis.wheelTest.platform };',
      '@/store/commonStore': 'export const useCommonStore = () => ({ config: { xzScaling: 1 } });',
      '@/store/progressStore': 'export const useProgressStore = () => ({ saveProgress: async () => {} });',
      '@/purchase/RewardProcessor': 'export const RewardProcessor = { applyAll: async rewards => { globalThis.wheelTest.rewards.push(rewards); } };',
    };
    builder.onResolve({ filter: /^@\// }, args => args.path in mocks ? { path: args.path, namespace: 'mock' } : undefined);
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents: mocks[args.path] }));
  } }],
});
const bundledModule = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(
  createRequire(import.meta.url), bundledModule, bundledModule.exports,
);
const { useMetaStore, useFortuneWheelStore, createPinia, setActivePinia } = bundledModule.exports;
function setup(saved = {}) {
  const state = { saved, rewards: [], fail: false, gate: null };
  state.platform = {
    getPlayerStats: async () => ({}), getPlayerData: async () => state.saved,
    setPlayerStats: async () => { if (state.gate) await state.gate; if (state.fail) throw new Error('save failed'); },
    setPlayerData: async data => { state.saved = data; },
  };
  globalThis.wheelTest = state;
  setActivePinia(createPinia());
  return { state, meta: useMetaStore(), wheel: useFortuneWheelStore() };
}

test('legacy spins migrate to standard and round-trip as preset balances', async () => {
  const { state, meta } = setup({ fortuneSpins: 7 });
  await meta.restoreProgress();
  assert.equal(meta.getFortuneSpins('standard'), 7);
  assert.equal(meta.getFortuneSpins('supplies'), 0);
  meta.addFortuneSpins('supplies', 3);
  await meta.saveProgress();
  assert.deepEqual(JSON.parse(state.saved.fortuneSpins), { standard: 7, supplies: 3 });
  meta.fortuneSpins = {};
  await meta.restoreProgress();
  assert.deepEqual(meta.fortuneSpins, { standard: 7, supplies: 3 });
});

test('a spin only consumes its preset and grants a reward from that preset once', async () => {
  const { state, meta, wheel } = setup();
  meta.addFortuneSpins('standard', 2);
  wheel.selectPreset('supplies');
  assert.equal(await wheel.beginSpin(), null);
  meta.addFortuneSpins('supplies', 1);
  const sector = await wheel.beginSpin();
  assert.ok(wheel.sectors.some(item => item.id === sector.id));
  assert.equal(meta.getFortuneSpins('standard'), 2);
  assert.equal(meta.getFortuneSpins('supplies'), 0);
  assert.equal(wheel.totalSpins, 2);
  assert.equal(wheel.selectPreset('standard'), false);
  const completion = wheel.completeSpin();
  assert.equal(await wheel.completeSpin(), false);
  assert.equal(await completion, true);
  assert.deepEqual(state.rewards, [sector.rewards]);
});

test('saving locks repeat starts and preset changes; failure refunds the same preset', async () => {
  const { state, meta, wheel } = setup();
  meta.addFortuneSpins('supplies', 2);
  wheel.selectPreset('supplies');
  let release;
  state.gate = new Promise(resolve => { release = resolve; });
  state.fail = true;
  const spin = wheel.beginSpin();
  assert.equal(wheel.isSpinning, true);
  assert.equal(wheel.selectPreset('standard'), false);
  assert.equal(await wheel.beginSpin(), null);
  release();
  const originalError = console.error;
  console.error = () => {};
  try { assert.equal(await spin, null); } finally { console.error = originalError; }
  assert.equal(meta.getFortuneSpins('supplies'), 2);
  assert.equal(meta.getFortuneSpins('standard'), 0);
  assert.equal(wheel.isSpinning, false);
});

test('invalid saved balances and unknown presets cannot create usable spins', async () => {
  const { meta, wheel } = setup({ fortuneSpins: '{"standard":-2,"supplies":2.9,"unknown":99}' });
  await meta.restoreProgress();
  assert.deepEqual(meta.fortuneSpins, { standard: 0, supplies: 2 });
  assert.equal(wheel.selectPreset('unknown'), false);
  assert.equal(meta.consumeFortuneSpin('unknown'), false);
  assert.throws(() => meta.addFortuneSpins('unknown', 1));
  meta.addFortuneSpins('standard', Infinity);
  assert.equal(meta.getFortuneSpins('standard'), 0);
});
