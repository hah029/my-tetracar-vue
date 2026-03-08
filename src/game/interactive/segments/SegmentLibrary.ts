import type { Segment } from "./Segment";
import { LanePattern as L } from "../types/LanePattern";
import { SegmentType as T } from "../types/SegmentType";

export const SEGMENTS: Segment[] = [
  /* ---------------- SAFE ---------------- */

  {
    id: "safe_run_1",
    difficulty: 1,
    length: 16,
    type: T.Safe,
    weight: 8,

    pattern: [
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },

  {
    id: "safe_coins",
    difficulty: 1,
    length: 16,
    type: T.Safe,
    weight: 7,

    pattern: [
      [L.Empty, L.Coin, L.Empty, L.Coin, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Coin, L.Empty, L.Coin, L.Empty, L.Coin],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },

  /* ---------------- COINS ---------------- */

  {
    id: "coin_lane",
    difficulty: 1,
    length: 16,
    type: T.Coins,
    weight: 7,

    pattern: [
      [L.Empty, L.CoinLine, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.CoinLine, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.CoinLine, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },

  {
    id: "coin_wave",
    difficulty: 1,
    length: 16,
    type: T.Coins,
    weight: 6,

    pattern: [
      [L.Coin, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Coin, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Coin, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Coin, L.Empty],
    ],
  },

  {
    id: "coin_spread",
    difficulty: 1,
    length: 16,
    type: T.Coins,
    weight: 6,

    pattern: [
      [L.Coin, L.Empty, L.Coin, L.Empty, L.Coin],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Coin, L.Empty, L.Coin, L.Empty, L.Coin],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },

  /* ---------------- OBSTACLES ---------------- */

  {
    id: "zigzag_1",
    difficulty: 1,
    length: 16,
    type: T.Obstacle,
    weight: 10,

    pattern: [
      [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Obstacle, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Obstacle, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Obstacle, L.Empty],
    ],
  },

  {
    id: "zigzag_2",
    difficulty: 1,
    length: 16,
    type: T.Obstacle,
    weight: 10,

    pattern: [
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Obstacle],
      [L.Empty, L.Empty, L.Empty, L.Obstacle, L.Empty],
      [L.Empty, L.Empty, L.Obstacle, L.Empty, L.Empty],
      [L.Empty, L.Obstacle, L.Empty, L.Empty, L.Empty],
    ],
  },

  {
    id: "center_block",
    difficulty: 1,
    length: 16,
    type: T.Obstacle,
    weight: 9,

    pattern: [
      [L.Empty, L.Empty, L.Obstacle, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Obstacle, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },

  {
    id: "lane_switch",
    difficulty: 1,
    length: 16,
    type: T.Obstacle,
    weight: 9,

    pattern: [
      [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Obstacle, L.Empty],
    ],
  },

  {
    id: "wide_block",
    difficulty: 2,
    length: 16,
    type: T.Obstacle,
    weight: 7,

    pattern: [
      [L.Empty, L.Obstacle, L.Obstacle, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Obstacle, L.Obstacle, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },

  {
    id: "moving_wall_1",
    difficulty: 2,
    length: 16,
    type: T.Obstacle,
    weight: 1,

    pattern: [
      [L.Empty, L.Empty, L.MovingObstacle, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },

  {
    id: "enemy_car_1",
    difficulty: 1,
    length: 16,
    type: T.Obstacle,
    weight: 100,

    pattern: [[L.Empty, L.EnemyCar, L.EnemyCar, L.Empty, L.Empty]],
  },
  {
    id: "enemy_car_2",
    difficulty: 1,
    length: 16,
    type: T.Obstacle,
    weight: 100,

    pattern: [[L.EnemyCar, L.Empty, L.EnemyCar, L.Empty, L.EnemyCar]],
  },
  {
    id: "enemy_car_2",
    difficulty: 1,
    length: 16,
    type: T.Obstacle,
    weight: 100,

    pattern: [[L.EnemyCar, L.Empty, L.Empty, L.EnemyCar, L.EnemyCar]],
  },

  /* ---------------- BOOST ---------------- */

  {
    id: "boost_reward",
    difficulty: 1,
    length: 16,
    type: T.Boost,
    weight: 3,

    pattern: [
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Coin, L.Coin, L.Coin, L.Coin, L.Coin],
      [L.Empty, L.Empty, L.BoosterNitro, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },

  {
    id: "boost_lane",
    difficulty: 2,
    length: 16,
    type: T.Boost,
    weight: 3,

    pattern: [
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Coin, L.Coin, L.Coin, L.Empty],
      [L.Empty, L.Empty, L.BoosterNitro, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },

  /* ---------------- JUMP (rare) ---------------- */

  {
    id: "jump_single",
    difficulty: 2,
    length: 16,
    type: T.Jump,
    weight: 2,

    pattern: [
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Jump, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Obstacle, L.Empty, L.Empty],
      [L.Empty, L.Coin, L.Empty, L.Coin, L.Empty],
    ],
  },

  {
    id: "jump_left",
    difficulty: 2,
    length: 16,
    type: T.Jump,
    weight: 2,

    pattern: [
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Jump, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Obstacle, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
      [L.Obstacle, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
    ],
  },

  {
    id: "jump_right",
    difficulty: 2,
    length: 16,
    type: T.Jump,
    weight: 2,

    pattern: [
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Jump],
      [L.Empty, L.Obstacle, L.Obstacle, L.Obstacle, L.Obstacle],
      [L.Empty, L.Empty, L.Obstacle, L.Obstacle, L.Obstacle],
    ],
  },

  /* ---------------- CHALLENGE ---------------- */

  {
    id: "challenge_zigzag",
    difficulty: 2,
    length: 16,
    type: T.Challenge,
    weight: 3,

    pattern: [
      [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Obstacle],
      [L.Empty, L.Obstacle, L.Empty, L.Obstacle, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Obstacle, L.Empty, L.Empty, L.Empty, L.Obstacle],
    ],
  },

  {
    id: "challenge_center",
    difficulty: 2,
    length: 16,
    type: T.Challenge,
    weight: 3,

    pattern: [
      [L.Empty, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
      [L.Empty, L.Obstacle, L.Obstacle, L.Obstacle, L.Empty],
      [L.Empty, L.Empty, L.Empty, L.Empty, L.Empty],
    ],
  },
];
