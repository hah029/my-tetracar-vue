import { SEGMENTS } from "./SegmentLibrary";
import type { Segment } from "./Segment";

export class SegmentGenerator {
  static getSegment(difficulty: number): Segment {
    const available = SEGMENTS.filter((s) => s.difficulty <= difficulty);

    if (available.length === 0) {
      return SEGMENTS[0];
    }

    return available[Math.floor(Math.random() * available.length)];
  }
}
