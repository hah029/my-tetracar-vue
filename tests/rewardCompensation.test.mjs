import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
const result = await build({
  stdin: { contents: `export { RewardProcessor } from './src/purchase/RewardProcessor';
    export { DAILY_GIFT_REWARDS } from './src/configs/dailyGift';`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', tsconfig: 'tsconfig.app.json',
  plugins: [{ name: 'reward-mocks', setup(builder) {
    const mocks = {
      '@/store/metaStore': 'export const useMetaStore = () => globalThis.rewardTest;',
      '@/store/playerStore': 'export const usePlayerStore = () => ({});',
    };
    builder.onResolve({ filter: /^@\// }, args => args.path in mocks ? { path: args.path, namespace: 'mock' } : undefined);
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents: mocks[args.path] }));
  } }],
});
const bundled = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), bundled, bundled.exports);
const { RewardProcessor, DAILY_GIFT_REWARDS } = bundled.exports;
function setup() {
  const state = {
    claimedRewardKeys: [], ownedSkins: [], levels: {}, golden: 0, energon: 0,
    getUpgradeLevel(key) { return this.levels[key] ?? 0; },
    increaseUpgrade(key, amount) { this.levels[key] = Math.min(3, this.getUpgradeLevel(key) + amount); },
    isSkinOwned(key) { return this.ownedSkins.includes(key); },
    unlockSkin(key) { this.ownedSkins.push(key); },
    addGolden(amount) { this.golden += amount; }, addEnergon(amount) { this.energon += amount; },
  };
  globalThis.rewardTest = state;
  return state;
}
const currency = { type: 'currency', effect: { currency: 'golden', amount: 750 } };

test('a daily upgrade is granted once per slot; its repeat grants compensation before the cap', async () => {
  const state = setup();
  const reward = DAILY_GIFT_REWARDS.find(r => r.day === 9).rewards.find(r => r.type === 'upgrade');
  await RewardProcessor.apply(reward);
  assert.equal(state.getUpgradeLevel('armorLevel'), 1);
  assert.equal(state.golden, 0);
  assert.deepEqual(RewardProcessor.resolve(reward), reward.fallback);
  await RewardProcessor.apply(reward);
  assert.equal(state.getUpgradeLevel('armorLevel'), 1);
  assert.equal(state.golden, 750);
});

test('different calendar slots may each grant one upgrade; capped upgrades compensate', async () => {
  const state = setup();
  for (const day of [12, 19, 23]) {
    await RewardProcessor.apply(DAILY_GIFT_REWARDS.find(r => r.day === day).rewards.find(r => r.type === 'upgrade'));
  }
  assert.equal(state.getUpgradeLevel('ammoLevel'), 3);
  state.levels.armorLevel = 3;
  await RewardProcessor.apply(DAILY_GIFT_REWARDS.find(r => r.day === 9).rewards.find(r => r.type === 'upgrade'));
  assert.equal(state.golden, 750);
});

test('new skins unlock once; owned skins pay the configured fallback', async () => {
  const state = setup();
  const reward = { type: 'cosmetic', effect: { skinId: 'basic1' }, fallback: currency };
  await RewardProcessor.apply(reward);
  await RewardProcessor.apply(reward);
  assert.deepEqual(state.ownedSkins, ['basic1']);
  assert.equal(state.golden, 750);
});

test('every daily unique reward has a currency fallback and placeholders never unlock', async () => {
  const state = setup();
  for (const reward of DAILY_GIFT_REWARDS.flatMap(day => day.rewards).filter(r => ['upgrade', 'cosmetic'].includes(r.type))) {
    assert.equal(reward.fallback.type, 'currency');
    assert.ok(reward.onceKey);
    if (reward.type === 'cosmetic') await RewardProcessor.apply(reward);
  }
  assert.deepEqual(state.ownedSkins, []);
  assert.equal(state.golden, 18500);
});

test('reward receipts describe the replacement currency instead of the original skin', async () => {
  setup();
  const receipts = await RewardProcessor.applyAll([{ type: 'cosmetic', effect: { skinId: '???' }, fallback: currency }]);
  assert.deepEqual(receipts, [{ type: 'currency', amount: 750, currency: 'golden', id: undefined, compensated: true }]);
});
