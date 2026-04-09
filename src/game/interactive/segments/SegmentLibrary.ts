import type { Segment } from "./Segment";
import { LanePattern as L } from "../types/LanePattern";
import { SegmentTypes as T } from "../types/SegmentType";

const SEGMENT_LENGHT = .9;

export const SEGMENTS: Segment[] = [
  /* ---------------- SAFE ---------------- */

//   {
//     id: "safe_coins_1",
//     difficulty: 1,
//     length: SEGMENT_LENGHT,
//     type: T.Safe,
//     weight: 7,

//     pattern: [
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.MovingObstacle, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty]
//     ]
//   },

  /* ---------------- COINS ---------------- */

  {
    id: "safe_coins_1",
    difficulty: 1,
    length: SEGMENT_LENGHT,
    type: T.Safe,
    weight: 7,

    pattern: [
      [L.Booster, L.Coin, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Coin, L.Empty, L.Obstacle, L.Obstacle],
      [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Coin, L.Empty, L.Empty],
      [L.Obstacle, L.Empty, L.Coin, L.Empty, L.Obstacle],
      [L.Empty, L.Empty, L.Coin, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
      [L.Obstacle, L.Obstacle, L.Empty, L.Coin, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty]
    ]
  },

  /* ---------------- OBSTACLES ---------------- */

//   {
//     id: "zigzag_1",
//     difficulty: 1,
//     length: SEGMENT_LENGHT,
//     type: T.Obstacle,
//     weight: 10,

//     pattern: [
//       [L.Obstacle, L.Empty, L.Coin, L.Obstacle, L.Empty], // 1
//       [L.Obstacle, L.Empty, L.Coin, L.Obstacle, L.Empty], // 1
//       [L.Obstacle, L.Empty, L.Coin, L.Empty, L.Obstacle], // 2
//       [L.Empty, L.Obstacle, L.Empty, L.Coin, L.Obstacle], // 3
//       [L.Empty, L.Obstacle, L.Empty, L.Coin, L.Empty], // 4
//       [L.Empty, L.Empty, L.Obstacle, L.Coin, L.Empty], // 5
//       [L.Empty, L.Empty, L.Obstacle, L.Coin, L.Empty], // 5
//       [L.Empty, L.Obstacle, L.Empty, L.Coin, L.Empty], // 4
//       [L.Empty, L.Obstacle, L.Coin, L.Empty, L.Obstacle], // 3
//       [L.Obstacle, L.Empty, L.Coin, L.Empty, L.Obstacle], // 2
//       [L.Obstacle, L.Empty, L.Coin, L.Obstacle, L.Empty], // 1
//       [L.Obstacle, L.Empty, L.Coin, L.Obstacle, L.Empty], // 1
//     ],
//   },


  /* ---------------- BOOST ---------------- */
//   {
//     id: "bullet_lane",
//     difficulty: 1,
//     length: SEGMENT_LENGHT,
//     type: T.Boost,
//     weight: 10,

//     pattern: [[L.Empty, L.Empty, L.BulletItem, L.Empty, L.Empty]],
//   },

  /* ---------------- JUMP (rare) ---------------- */

//   {
//     id: "jump_center",
//     difficulty: 2,
//     length: SEGMENT_LENGHT,
//     type: T.Jump,
//     weight: 2,

//     pattern: [
//       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Empty, L.Jump, L.Empty, L.Empty],
//       [L.Empty, L.Empty, L.Obstacle, L.Empty, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
//     ],
//   },

//   {
//     id: "jump_left",
//     difficulty: 2,
//     length: SEGMENT_LENGHT,
//     type: T.Jump,
//     weight: 2,

//     pattern: [
//       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
//       [L.Jump, L.Empty, L.Empty, L.Empty, L.Empty],
//       [L.Obstacle, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
//       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
//     ],
//   },

];
