export type LanePattern =
  | 0 // Empty
  | 1 // Coin
  | 2 // CoinLine
  | 3 // Obstacle
  | 4 // MovingObstacle
  | 5 // EnemyCar
  | 6 // Jump
  | 7 // Booster
  | 8; // BulletItem

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
} as const;
