import type { RewardDefinition } from "@/purchase/types";

export type FortuneWheelSector = {
  id: string;
  weight: number;
  color: string;
  rewards: RewardDefinition[];
};

export type FortuneWheelPreset = {
  id: string;
  nameKey: string;
  sectors: FortuneWheelSector[];
};
