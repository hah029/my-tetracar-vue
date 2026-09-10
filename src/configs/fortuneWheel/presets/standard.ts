import type { FortuneWheelPreset } from "../types";

export default {
  id: "standard" as const,
  nameKey: "fortuneWheel.presets.standard",
  sectors: [
  { id: "gold_100", weight: 28, color: "#9b600f", rewards: [{ type: "currency", effect: { currency: "golden", amount: 100 } }] },
  { id: "ammo", weight: 21, color: "#196b6b", rewards: [{ type: "ammo", effect: { amount: 1 } }] },
  { id: "gold_250", weight: 18, color: "#214a83", rewards: [{ type: "currency", effect: { currency: "golden", amount: 250 } }] },
  { id: "armor", weight: 12, color: "#9f6516", rewards: [{ type: "armor", effect: { amount: 1 } }] },
  { id: "energon_1", weight: 10, color: "#542a83", rewards: [{ type: "currency", effect: { currency: "energon", amount: 1 } }] },
  { id: "gold_600", weight: 7, color: "#216c5b", rewards: [{ type: "currency", effect: { currency: "golden", amount: 600 } }] },
  { id: "energon_2", weight: 3, color: "#204c88", rewards: [{ type: "currency", effect: { currency: "energon", amount: 2 } }] },
  { id: "armor_2", weight: 1, color: "#4b367b", rewards: [{ type: "armor", effect: { amount: 2 } }] },
  ],
} satisfies FortuneWheelPreset;
