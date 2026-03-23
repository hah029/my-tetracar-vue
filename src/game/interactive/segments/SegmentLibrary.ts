import type { Segment } from "./Segment";
import { LanePattern as L } from "../types/LanePattern";
import { SegmentTypes as T } from "../types/SegmentType";

const SEGMENT_LENGHT = 1;

export const SEGMENTS: Segment[] = [
  /* ---------------- SAFE ---------------- */

  // {
  //   id: "safe_run_1",
  //   difficulty: 1,
  //   length: SEGMENT_LENGHT,
  //   type: T.Safe,
  //   weight: 8,

  //   pattern: [[L.Empty, L.Empty, L.Empty, L.Empty, L.Empty]],
  // },

  /* ---------------- COINS ---------------- */

  {
    id: "safe_coins_1",
    difficulty: 1,
    length: SEGMENT_LENGHT,
    type: T.Safe,
    weight: 7,

    pattern: [
      [L.Coin, L.Empty, L.Coin, L.Empty, L.Coin],
      [L.Coin, L.Empty, L.Coin, L.Empty, L.Coin],
      [L.Coin, L.Empty, L.Coin, L.Empty, L.Coin],
      [L.Coin, L.Empty, L.Coin, L.Empty, L.Coin],
      [L.Coin, L.Empty, L.Coin, L.Empty, L.Coin],
    ],
  },

  {
    id: "safe_coins_2",
    difficulty: 1,
    length: SEGMENT_LENGHT,
    type: T.Safe,
    weight: 7,

    pattern: [
      [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Coin, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Coin, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Coin, L.Empty, L.Empty],
    ],
  },

  {
    id: "safe_coins_3",
    difficulty: 1,
    length: SEGMENT_LENGHT,
    type: T.Safe,
    weight: 7,

    pattern: [
      [L.Coin, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Coin, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Coin, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Coin, L.Empty, L.Empty],
    ],
  },
  // {
  //   id: "coin_wave",
  //   difficulty: 1,
  //   length: SEGMENT_LENGHT,
  //   type: T.Coins,
  //   weight: 6,

  //   pattern: [
  //     [L.Coin, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Coin, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
  //   ],
  // },

  // {
  //   id: "coin_spread",
  //   difficulty: 1,
  //   length: SEGMENT_LENGHT,
  //   type: T.Coins,
  //   weight: 6,

  //   pattern: [
  //     [L.Coin, L.Empty, L.Coin, L.Empty, L.Coin],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Coin, L.Empty, L.Coin, L.Empty, L.Coin],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //   ],
  // },

  /* ---------------- OBSTACLES ---------------- */

  {
    id: "zigzag_1",
    difficulty: 1,
    length: SEGMENT_LENGHT,
    type: T.Obstacle,
    weight: 10,

    pattern: [
      [L.Obstacle, L.Empty, L.Coin, L.Obstacle, L.Empty], // 1
      [L.Obstacle, L.Empty, L.Coin, L.Obstacle, L.Empty], // 1
      [L.Obstacle, L.Empty, L.Coin, L.Empty, L.Obstacle], // 2
      [L.Empty, L.Obstacle, L.Empty, L.Coin, L.Obstacle], // 3
      [L.Empty, L.Obstacle, L.Empty, L.Coin, L.Empty], // 4
      [L.Empty, L.Empty, L.Obstacle, L.Coin, L.Empty], // 5
      [L.Empty, L.Empty, L.Obstacle, L.Coin, L.Empty], // 5
      [L.Empty, L.Obstacle, L.Empty, L.Coin, L.Empty], // 4
      [L.Empty, L.Obstacle, L.Coin, L.Empty, L.Obstacle], // 3
      [L.Obstacle, L.Empty, L.Coin, L.Empty, L.Obstacle], // 2
      [L.Obstacle, L.Empty, L.Coin, L.Obstacle, L.Empty], // 1
      [L.Obstacle, L.Empty, L.Coin, L.Obstacle, L.Empty], // 1
    ],
  },

  // {
  //   id: "zigzag_2",
  //   difficulty: 1,
  //   length: SEGMENT_LENGHT,
  //   type: T.Obstacle,
  //   weight: 10,

  //   pattern: [
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Obstacle],
  //     [L.Empty, L.Empty, L.Empty, L.Obstacle, L.Empty],
  //     [L.Empty, L.Empty, L.Obstacle, L.Empty, L.Empty],
  //     [L.Empty, L.Obstacle, L.Empty, L.Empty, L.Empty],
  //   ],
  // },

  // {
  //   id: "center_block",
  //   difficulty: 1,
  //   length: SEGMENT_LENGHT,
  //   type: T.Obstacle,
  //   weight: 9,

  //   pattern: [
  //     [L.Empty, L.Empty, L.Obstacle, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Obstacle, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //   ],
  // },

  // {
  //   id: "lane_switch",
  //   difficulty: 1,
  //   length: SEGMENT_LENGHT,
  //   type: T.Obstacle,
  //   weight: 9,

  //   pattern: [
  //     [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Obstacle, L.Empty],
  //   ],
  // },

  // {
  //   id: "wide_block",
  //   difficulty: 2,
  //   length: SEGMENT_LENGHT,
  //   type: T.Obstacle,
  //   weight: 7,

  //   pattern: [
  //     [L.Empty, L.Obstacle, L.Obstacle, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Empty, L.Obstacle, L.Obstacle, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //   ],
  // },

  // {
  //   id: "moving_wall_1",
  //   difficulty: 2,
  //   length: SEGMENT_LENGHT,
  //   type: T.Obstacle,
  //   weight: 1,

  //   pattern: [
  //     [L.Empty, L.Empty, L.MovingObstacle, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //   ],
  // },

  // {
  //   id: "enemy_car_1",
  //   difficulty: 1,
  //   length: SEGMENT_LENGHT,
  //   type: T.Obstacle,
  //   weight: 100,

  //   pattern: [[L.Empty, L.EnemyCar, L.EnemyCar, L.Empty, L.Empty]],
  // },
  // {
  //   id: "enemy_car_2",
  //   difficulty: 1,
  //   length: SEGMENT_LENGHT,
  //   type: T.Obstacle,
  //   weight: 100,

  //   pattern: [[L.EnemyCar, L.Empty, L.EnemyCar, L.Empty, L.EnemyCar]],
  // },
  // {
  //   id: "enemy_car_2",
  //   difficulty: 1,
  //   length: SEGMENT_LENGHT,
  //   type: T.Obstacle,
  //   weight: 100,

  //   pattern: [[L.EnemyCar, L.Empty, L.Empty, L.EnemyCar, L.EnemyCar]],
  // },

  /* ---------------- BOOST ---------------- */
  {
    id: "boost_reward",
    difficulty: 1,
    length: SEGMENT_LENGHT,
    type: T.Boost,
    weight: 3,

    pattern: [
      [L.Empty, L.Empty, L.Coin, L.Empty, L.Empty],
      [L.Empty, L.Coin, L.Empty, L.Coin, L.Empty],
      [L.Booster, L.Empty, L.Empty, L.Empty, L.Booster],
      [L.Empty, L.Coin, L.Empty, L.Coin, L.Empty],
      [L.Empty, L.Empty, L.Coin, L.Empty, L.Empty],
    ],
  },

  {
    id: "bullet_lane",
    difficulty: 1,
    length: SEGMENT_LENGHT,
    type: T.Boost,
    weight: 10,

    pattern: [[L.Empty, L.Empty, L.BulletItem, L.Empty, L.Empty]],
  },

  /* ---------------- JUMP (rare) ---------------- */

  {
    id: "jump_center",
    difficulty: 2,
    length: SEGMENT_LENGHT,
    type: T.Jump,
    weight: 2,

    pattern: [
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Jump, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Obstacle, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },

  {
    id: "jump_left",
    difficulty: 2,
    length: SEGMENT_LENGHT,
    type: T.Jump,
    weight: 2,

    pattern: [
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Jump, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Obstacle, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },

  // {
  //   id: "jump_right",
  //   difficulty: 2,
  //   length: SEGMENT_LENGHT,
  //   type: T.Jump,
  //   weight: 2,

  //   pattern: [
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Jump],
  //     [L.Empty, L.Obstacle, L.Obstacle, L.Obstacle, L.Obstacle],
  //   ],
  // },

  /* ---------------- CHALLENGE ---------------- */

  // {
  //   id: "challenge_zigzag",
  //   difficulty: 2,
  //   length: SEGMENT_LENGHT * 2,
  //   type: T.Challenge,
  //   weight: 3,

  //   pattern: [
  //     [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Obstacle],
  //     [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Obstacle],
  //     [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Obstacle],
  //     [L.Empty, L.Obstacle, L.Empty, L.Obstacle, L.Empty],
  //     [L.Empty, L.Obstacle, L.Empty, L.Obstacle, L.Empty],
  //     [L.Empty, L.Obstacle, L.Empty, L.Obstacle, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //     [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Obstacle],
  //     [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Obstacle],
  //     [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Obstacle],
  //   ],
  // },

  //   {
  //     id: "challenge_center",
  //     difficulty: 2,
  //     length: SEGMENT_LENGHT * 2,
  //     type: T.Challenge,
  //     weight: 3,

  //     pattern: [
  //       [L.Empty, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
  //       [L.Empty, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
  //       [L.Empty, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
  //       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //       [L.Empty, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
  //       [L.Empty, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
  //       [L.Empty, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
  //       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //       [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
  //     ],
  //   },
];
