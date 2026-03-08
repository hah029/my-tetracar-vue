import type { Segment } from "./Segment";
import { LanePattern } from "../types/LanePattern";

export const SEGMENTS: Segment[] = [
  {
    id: "easy_1",
    difficulty: 1,
    length: 10,
    pattern: [
      LanePattern.Empty,
      LanePattern.CoinLine,
      LanePattern.Empty,
      LanePattern.Obstacle,
      LanePattern.Empty,
    ],
  },

  {
    id: "easy_2",
    difficulty: 1,
    length: 10,
    pattern: [
      LanePattern.Empty,
      LanePattern.Empty,
      LanePattern.Jump,
      LanePattern.Empty,
      LanePattern.Coin,
    ],
  },

  {
    id: "boost_1",
    difficulty: 2,
    length: 12,
    pattern: [
      LanePattern.Obstacle,
      LanePattern.Empty,
      LanePattern.Empty,
      LanePattern.BoosterNitro,
      LanePattern.Empty,
    ],
  },
];
