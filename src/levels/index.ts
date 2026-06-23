import mistyHills from "@/levels/configs/mistyHills";
import nightCity from "@/levels/configs/nightCity";
import stormOcean from "@/levels/configs/stormOcean";
import volcanicIsland from "@/levels/configs/volcanicIsland";
import type { LevelConfig } from "@/levels/types";

export const LEVELS = {
  night_city: nightCity,
  misty_hills: mistyHills,
  storm_ocean: stormOcean,
  volcanic_island: volcanicIsland,
} as const satisfies Record<string, LevelConfig>;

export type LevelId = keyof typeof LEVELS;

export const DEFAULT_LEVEL_ID: LevelId = "night_city";

export const LEVEL_LIST = Object.values(LEVELS);
