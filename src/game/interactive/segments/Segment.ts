import { LanePattern } from "../types/LanePattern";
import type { SegmentType } from "../types/SegmentType";

export type Segment = {
  id: string;
  difficulty: number;
  type: SegmentType;
  weight: number;
  pattern: LanePattern[][];
  canReversed?: boolean;
  elevatedSections?: SegmentElevatedSection[];
  curve?: SegmentCurve;
};

export type SegmentCurve = {
  direction: "left" | "right";
  /** Полный угол дуги в градусах (насколько изогнут сегмент) */
  totalAngleDeg?: number;
  rowStart?: number;
  rowEnd?: number;
};

export type SegmentElevatedSection = {
  lanes: number[];
  rowStart: number;
  rowEnd: number;
  height: number;
  rampRows: number;
  rampIn?: boolean;
  rampOut?: boolean;
  color?: string;
  emissiveColor?: string;
  emissiveIntensity?: number;
  opacity?: number;
};
