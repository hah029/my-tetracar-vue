import type { FortuneWheelPreset } from "../types";

export default {
  id: "daily" as const,
  nameKey: "fortuneWheel.presets.daily",
  sectors: [
    {
      id: "ammo_1",
      weight: 45,
      color: "#725cb5",
      rewards: [{ type: "ammo", effect: { amount: 1 } }],
    },
    {
      id: "armor_1",
      weight: 30,
      color: "#4a9a99",
      rewards: [{ type: "armor", effect: { amount: 1 } }],
    },
    {
      id: "ammo_2",
      weight: 20,
      color: "#386fbe",
      rewards: [{ type: "ammo", effect: { amount: 2 } }],
    },
    {
      id: "armor_2",
      weight: 5,
      color: "#5ca472",
      rewards: [{ type: "armor", effect: { amount: 2 } }],
    },
  ],
} satisfies FortuneWheelPreset;
