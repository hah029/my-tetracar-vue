import type { Segment } from "./Segment";
import { SegmentGenerator } from "./SegmentGenerator";

export class SegmentQueue {
  private queue: Segment[] = [];
  private queueSize = 3;
  private difficulty: () => number;
  private laneCount: () => number;
  private segmentPool: () => readonly Segment[] | undefined;

  constructor(
    difficulty: () => number,
    laneCount: () => number,
    segmentPool: () => readonly Segment[] | undefined = () => undefined,
  ) {
    this.difficulty = difficulty;
    this.laneCount = laneCount;
    this.segmentPool = segmentPool;
  }

  public getNext(): Segment {
    if (this.queue.length < this.queueSize) {
      this.generate();
    }

    const seg = this.queue.shift();

    if (!seg) {
      return SegmentGenerator.getSegment(
        this.difficulty(),
        this.laneCount(),
        this.segmentPool(),
      );
    }

    return seg;
  }

  private generate() {
    const segment = SegmentGenerator.getSegment(
      this.difficulty(),
      this.laneCount(),
      this.segmentPool(),
    );
    this.queue.push(segment);
  }

  public reset() {
    this.queue = [];
  }
}
