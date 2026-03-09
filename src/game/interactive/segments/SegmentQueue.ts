import type { Segment } from "./Segment";
import { SegmentGenerator } from "./SegmentGenerator";

export class SegmentQueue {
  private queue: Segment[] = [];
  private queueSize = 6;
  private difficulty: () => number;

  constructor(difficulty: () => number) {
    this.difficulty = difficulty;
  }

  public getNext(): Segment {
    if (this.queue.length < this.queueSize) {
      this.generate();
    }

    const seg = this.queue.shift();

    if (!seg) {
      return SegmentGenerator.getSegment(this.difficulty());
    }

    return seg;
  }

  private generate() {
    const segment = SegmentGenerator.getSegment(this.difficulty());

    this.queue.push(segment);
  }

  public reset() {
    this.queue = [];
  }
}
