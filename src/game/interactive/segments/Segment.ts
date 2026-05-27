import { LanePattern } from "../types/LanePattern";
import type { SegmentType } from "../types/SegmentType";

export type Segment = {
  id: string;
  difficulty: number;
  type: SegmentType;
  weight: number;
  pattern: LanePattern[][];
  canReversed?: boolean;
};
