import type { ObstacleKind } from "@/telemetry";
import type { BaseObstacle } from "./BaseObstacle";
import { EnemyCar } from "./EnemyCar";
import { MovingObstacle } from "./MovingObstacle";
import { StaticObstacle } from "./StaticObstacle";

export function getObstacleKind(obstacle: BaseObstacle): ObstacleKind {
  if (obstacle instanceof EnemyCar) return "enemy";
  if (obstacle instanceof MovingObstacle) return "moving";
  if (obstacle instanceof StaticObstacle) return "static";
  return "static";
}
