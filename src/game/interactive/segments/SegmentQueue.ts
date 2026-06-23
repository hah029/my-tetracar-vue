import type { Segment } from "./Segment";
import { SegmentGenerator } from "./SegmentGenerator";

export class SegmentQueue {
  private queue: Segment[] = [];
  private queueSize = 3;
  private difficulty: () => number;
  private laneCount: () => number;

  constructor(difficulty: () => number, laneCount: () => number) {
    this.difficulty = difficulty;
    this.laneCount = laneCount;
  }

  public getNext(): Segment {
    if (this.queue.length < this.queueSize) {
      this.generate();
    }

    const seg = this.queue.shift();

    if (!seg) {
      return SegmentGenerator.getSegment(this.difficulty(), this.laneCount());
    }

    return seg;
  }

  private generate() {
    const segment = SegmentGenerator.getSegment(
      this.difficulty(),
      this.laneCount(),
    );
    this.queue.push(segment);
  }

  public reset() {
    this.queue = [];
  }
}
