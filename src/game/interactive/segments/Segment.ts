import { LanePattern } from "../types/LanePattern";
import type { SegmentType } from "../types/SegmentType";

export type Segment = {
  id: string;
  difficulty: number;
  length: number;
  type: SegmentType;
  weight: number;
  pattern: LanePattern[][];
};
