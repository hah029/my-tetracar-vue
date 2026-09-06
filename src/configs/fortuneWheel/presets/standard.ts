import type { FortuneWheelPreset } from "../types";

export default {
  id: "standard" as const,
  nameKey: "fortuneWheel.presets.standard",
  sectors: [
  { id: "gold_100", weight: 28, color: "#3b78b7", rewards: [{ type: "currency", effect: { currency: "golden", amount: 100 } }] },
  { id: "ammo", weight: 21, color: "#725cb5", rewards: [{ type: "ammo", effect: { amount: 1 } }] },
  { id: "gold_250", weight: 18, color: "#c28b2b", rewards: [{ type: "currency", effect: { currency: "golden", amount: 250 } }] },
  { id: "armor", weight: 12, color: "#4a9a99", rewards: [{ type: "armor", effect: { amount: 1 } }] },
  { id: "energon_1", weight: 10, color: "#386fbe", rewards: [{ type: "currency", effect: { currency: "energon", amount: 1 } }] },
  { id: "gold_600", weight: 7, color: "#d89b24", rewards: [{ type: "currency", effect: { currency: "golden", amount: 600 } }] },
  { id: "energon_2", weight: 3, color: "#a968c1", rewards: [{ type: "currency", effect: { currency: "energon", amount: 2 } }] },
  { id: "armor_2", weight: 1, color: "#5ca472", rewards: [{ type: "armor", effect: { amount: 2 } }] },
  ],
} satisfies FortuneWheelPreset;
