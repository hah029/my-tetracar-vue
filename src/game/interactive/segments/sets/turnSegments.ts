import type { Segment } from "../Segment";
import { LanePattern as L } from "../../types/LanePattern";
import { SegmentTypes as T } from "../../types/SegmentType";

const TURN_ROW_COUNT = 120;
const TURN_CURVE_START = 1;
const TURN_CURVE_END = TURN_ROW_COUNT;
const CENTER_LANE = 2;

function emptyRow(): L[] {
  return [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty];
}

function makeTurnPattern(direction: "left" | "right"): L[][] {
  return Array.from({ length: TURN_ROW_COUNT }, (_, rowIndex) => {
    const row = emptyRow();

    if (rowIndex < 6 || rowIndex > TURN_ROW_COUNT - 7) {
      return row;
    }

    if (rowIndex % 4 === 0) {
      const travel = Math.sin((rowIndex / (TURN_ROW_COUNT - 1)) * Math.PI);
      const laneShift = Math.round(travel * 2);
      const lane =
        direction === "left"
          ? CENTER_LANE - laneShift
          : CENTER_LANE + laneShift;
      row[Math.max(0, Math.min(row.length - 1, lane))] = L.Coin;
    }

    if (rowIndex === Math.floor(TURN_ROW_COUNT / 2)) {
      row[CENTER_LANE] = L.Booster;
    }

    // Временный отладочный набор для проверки синхронизации с дугой.
    if (rowIndex === 30) {
      row[direction === "left" ? 3 : 1] = L.Obstacle1;
    }
    if (rowIndex === 60) {
      row[direction === "left" ? 1 : 3] = L.Nitro;
    }
    if (rowIndex === 90) {
      row[CENTER_LANE] = L.Obstacle3;
    }

    return row;
  });
}

export const TURN_SEGMENTS: Segment[] = [
  {
    id: "longLeftTurn",
    type: T.Scenario,
    weight: 4,
    canReversed: false,
    difficulty: 2,
    curve: {
      direction: "left",
      totalAngleDeg: 45,
      rowStart: TURN_CURVE_START,
      rowEnd: TURN_CURVE_END,
    },
    pattern: makeTurnPattern("left"),
  },
  {
    id: "longRightTurn",
    type: T.Scenario,
    weight: 4,
    canReversed: false,
    difficulty: 2,
    curve: {
      direction: "right",
      totalAngleDeg: 45,
      rowStart: TURN_CURVE_START,
      rowEnd: TURN_CURVE_END,
    },
    pattern: makeTurnPattern("right"),
  },
];
