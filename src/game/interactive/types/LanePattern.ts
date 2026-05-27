export type LanePattern =
  | 0 // Empty
  | 1 // Coin
  | 2 // CoinLine
  | 3 // Obstacle
  | 4 // MovingObstacle
  | 5 // EnemyCar
  | 6 // Jump
  | 7 // Booster
  | 8 // BulletItem
  | 9 // Nitro
  | 10 // Shield
  | 11 // JumpCoins
  | 12 // Magnet
  | 13 // Energon
  | 14 // Obstacle1
  | 15 // Obstacle2
  | 16; // Obstacle3

// Если нужны константы с именами:
export const LanePattern = {
  Empty: 0,
  Coin: 1,
  CoinLine: 2,
  Obstacle: 3,
  MovingObstacle: 4,
  EnemyCar: 5,
  Jump: 6,
  Booster: 7,
  BulletItem: 8,
  Nitro: 9,
  Shield: 10,
  JumpCoins: 11,
  Magnet: 12,
  Energon: 13,
  Obstacle1: 14,
  Obstacle2: 15,
  Obstacle3: 16,
} as const;
