import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";

const result = await build({
  stdin: {
    contents: "export { PurchaseService } from './src/purchase/PurchaseService';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  tsconfig: "tsconfig.app.json",
  loader: { ".glb": "dataurl", ".png": "dataurl" },
  plugins: [
    {
      name: "purchase-recovery-mocks",
      setup(builder) {
        const mocks = {
          "@/sdk/Platform": "export const Platform = { getInstance: () => globalThis.purchasePlatform };",
          "@/purchase/services/WalletService": "export const WalletService = { spendCurrency: () => true };",
          "@/purchase/RewardProcessor": "export const RewardProcessor = { apply: async (product) => { globalThis.purchaseEvents.push('grant'); globalThis.purchaseRewards.push(product.id); } };",
          "@/store/metaStore": "export const useMetaStore = () => globalThis.purchaseMeta;",
          "@/store/progressStore": "export const useProgressStore = () => globalThis.purchaseProgress;",
          "@/telemetry": "export const Telemetry = { emit: () => undefined };",
        };
        builder.onResolve({ filter: /^@\// }, (args) =>
          args.path in mocks ? { path: args.path, namespace: "mock" } : undefined,
        );
        builder.onResolve({ filter: /^\.\/RewardProcessor$/ }, () => ({
          path: "@/purchase/RewardProcessor",
          namespace: "mock",
        }));
        builder.onResolve({ filter: /^\.\/services\/WalletService$/ }, () => ({
          path: "@/purchase/services/WalletService",
          namespace: "mock",
        }));
        builder.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
          contents: mocks[args.path],
        }));
      },
    },
  ],
});

const bundled = { exports: {} };
new Function("require", "module", "exports", result.outputFiles[0].text)(
  createRequire(import.meta.url),
  bundled,
  bundled.exports,
);
const { PurchaseService } = bundled.exports;

function setup({ receipts = [], failConsume = false } = {}) {
  const savedReceipts = new Map();
  const consumed = [];
  globalThis.purchaseRewards = [];
  globalThis.purchaseEvents = [];
  globalThis.purchaseProgress = {
    saveArmorAndAmmo: async () => globalThis.purchaseEvents.push("save-reward"),
  };
  globalThis.purchaseMeta = {
    getIapReceipt: (token) => savedReceipts.get(token) ?? null,
    setIapReceipt: (token, productId, status) => savedReceipts.set(token, { productId, status }),
    saveProgress: async () => globalThis.purchaseEvents.push("save-meta"),
  };
  globalThis.purchasePlatform = {
    getPendingPurchases: async () => receipts,
    buyShopItem: async (productID) => ({ productID, purchaseToken: "new-token" }),
    consumePurchase: async (token) => {
      if (failConsume) throw new Error("consume failed");
      globalThis.purchaseEvents.push("consume");
      consumed.push(token);
    },
  };
  return { savedReceipts, consumed };
}

test("recovery grants, persists and then consumes a new receipt", async () => {
  const state = setup({
    receipts: [{ productID: "10Kgoldens", purchaseToken: "receipt-1" }],
  });

  await new PurchaseService().recoverPendingPurchases();

  assert.deepEqual(globalThis.purchaseRewards, ["10Kgoldens"]);
  assert.deepEqual(state.consumed, ["receipt-1"]);
  assert.deepEqual(state.savedReceipts.get("receipt-1"), {
    productId: "10Kgoldens",
    status: "consumed",
  });
});

test("a new purchase grants and persists before consume", async () => {
  setup();
  const result = await new PurchaseService().purchase({
    id: "10Kgoldens",
    type: "currency",
    title: "10K",
    price: { value: 99, currency: "RUB" },
    effect: { currency: "golden", amount: 10000 },
  });

  assert.equal(result.success, true);
  assert.deepEqual(globalThis.purchaseEvents, [
    "grant",
    "save-reward",
    "save-meta",
    "save-meta",
    "consume",
    "save-meta",
  ]);
});

test("a granted receipt retries consume without granting a second reward", async () => {
  const state = setup({
    receipts: [{ productID: "10Kgoldens", purchaseToken: "receipt-2" }],
  });
  state.savedReceipts.set("receipt-2", { productId: "10Kgoldens", status: "granted" });

  await new PurchaseService().recoverPendingPurchases();

  assert.deepEqual(globalThis.purchaseRewards, []);
  assert.deepEqual(state.consumed, ["receipt-2"]);
  assert.equal(state.savedReceipts.get("receipt-2").status, "consumed");
});

test("a consume failure leaves the granted receipt recoverable without duplicate grant", async () => {
  const first = setup({
    receipts: [{ productID: "10Kgoldens", purchaseToken: "receipt-3" }],
    failConsume: true,
  });

  const originalConsoleError = console.error;
  console.error = () => undefined;
  try {
    await new PurchaseService().recoverPendingPurchases();
  } finally {
    console.error = originalConsoleError;
  }
  assert.deepEqual(globalThis.purchaseRewards, ["10Kgoldens"]);
  assert.equal(first.savedReceipts.get("receipt-3").status, "granted");

  globalThis.purchasePlatform.consumePurchase = async (token) => first.consumed.push(token);
  await new PurchaseService().recoverPendingPurchases();

  assert.deepEqual(globalThis.purchaseRewards, ["10Kgoldens"]);
  assert.deepEqual(first.consumed, ["receipt-3"]);
  assert.equal(first.savedReceipts.get("receipt-3").status, "consumed");
});
