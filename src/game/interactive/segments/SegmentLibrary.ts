import type { Segment } from "./Segment";
import { LanePattern as L } from "../types/LanePattern";
import { SegmentTypes as T } from "../types/SegmentType";

export const SEGMENT_ROW_BODY_LENGHT = 0.9;
export const SEGMENT_ROW_SPACING_LENGHT = 1.8;

export const SEGMENT_ROW_LENGTH =
  SEGMENT_ROW_BODY_LENGHT + SEGMENT_ROW_SPACING_LENGHT;

export const SEGMENTS: Segment[] = [
  {
    id: "default",
    type: T.Quick,
    weight: 7,
    canReversed: true,

    pattern: [
      [L.Coin, L.Coin, L.Empty, L.Empty, L.Empty],
      [L.Coin, L.Coin, L.Empty, L.Obstacle, L.Obstacle],
      [L.Coin, L.Coin, L.Empty, L.Empty, L.Empty],
      [L.Coin, L.Empty, L.Coin, L.Empty, L.Empty],
      [L.Coin, L.Empty, L.Coin, L.Empty, L.Obstacle],
      [L.Coin, L.Empty, L.Coin, L.Empty, L.Empty],
      [L.Coin, L.Empty, L.Empty, L.Coin, L.Empty],
      [L.Coin, L.Obstacle, L.Empty, L.Coin, L.Empty],
      [L.Coin, L.Empty, L.Empty, L.Coin, L.Empty],
      [L.Coin, L.Empty, L.Empty, L.Coin, L.Empty],
    ],
  },
];
