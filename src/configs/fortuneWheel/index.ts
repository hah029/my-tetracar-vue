import standard from "./presets/standard";
import supplies from "./presets/supplies";
export type { FortuneWheelPreset, FortuneWheelSector } from "./types";

export const FORTUNE_WHEEL_PRESETS = { standard, supplies };
export type FortuneWheelPresetId = keyof typeof FORTUNE_WHEEL_PRESETS;
export const DEFAULT_FORTUNE_WHEEL_PRESET: FortuneWheelPresetId = "standard";

export function isFortuneWheelPresetId(value: unknown): value is FortuneWheelPresetId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(FORTUNE_WHEEL_PRESETS, value);
}
