import { SEGMENTS } from "./SegmentLibrary";
import type { Segment } from "./Segment";
import { SegmentTypes } from "../types/SegmentType";
import { LanePattern } from "../types/LanePattern";

export class SegmentGenerator {
  private static history: Segment[] = [];
  private static historySize = 3;

  static getSegment(difficulty: number): Segment {
    // 1️⃣ фильтр по сложности
    const available = SEGMENTS.filter((s) => s.difficulty <= difficulty);

    // 2️⃣ оставляем только playable сегменты
    let pool = available.filter((s) =>
      SegmentGenerator.isSegmentPlayable(s.pattern),
    );

    if (pool.length === 0) {
      pool = available;
    }

    const last = this.history[this.history.length - 1];

    if (last) {
      // 3️⃣ не повторяем один и тот же тип подряд
      const noSameType = pool.filter((s) => s.type !== last.type);

      if (noSameType.length > 0) {
        pool = noSameType;
      }

      // 4️⃣ после challenge даём отдых
      if (last.type === SegmentTypes.Challenge) {
        const restPool = pool.filter(
          (s) =>
            s.type === SegmentTypes.Safe ||
            s.type === SegmentTypes.Coins ||
            s.type === SegmentTypes.Boost,
        );

        if (restPool.length > 0) {
          pool = restPool;
        }
      }

      // 5️⃣ после jump не даём jump
      if (last.type === SegmentTypes.Jump) {
        const noJump = pool.filter((s) => s.type !== SegmentTypes.Jump);

        if (noJump.length > 0) {
          pool = noJump;
        }
      }
    }

    // 6️⃣ убираем недавние сегменты (anti-repeat)
    const notRecent = pool.filter(
      (s) => !this.history.some((h) => h.id === s.id),
    );

    if (notRecent.length > 0) {
      pool = notRecent;
    }

    // 7️⃣ выбираем случайный
    const segment = this.weightedRandom(pool);

    // 8️⃣ обновляем историю
    this.history.push(segment);

    if (this.history.length > this.historySize) {
      this.history.shift();
    }

    return segment;
  }

  // --- SAFE LANE RULES ---

  static hasSafeLane(row: LanePattern[]): boolean {
    return row.some(
      (cell) =>
        cell === LanePattern.Empty ||
        cell === LanePattern.Coin ||
        cell === LanePattern.CoinLine,
    );
  }

  static isSegmentPlayable(pattern: LanePattern[][]): boolean {
    return pattern.every((row) => SegmentGenerator.hasSafeLane(row));
  }

  private static weightedRandom(pool: Segment[]): Segment {
    const totalWeight = pool.reduce((sum, s) => sum + s.weight, 0);

    let r = Math.random() * totalWeight;

    for (const segment of pool) {
      r -= segment.weight;
      if (r <= 0) return segment;
    }

    const pool_ = pool[0];
    if (pool_ === undefined) throw new Error("No segment found");

    return pool_;
  }
}
