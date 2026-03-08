import { LanePattern } from "../types/LanePattern";

export type Segment = {
  id: string;
  difficulty: number;
  length: number;
  pattern: LanePattern[];
};
