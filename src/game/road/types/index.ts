// Общие типы и интерфейсы
export interface RoadLineConfig {
  x: number;
  z: number;
  gap: number;
  color?: number;
  emissive?: number;
  opacity?: number;
  length?: number;
}

export interface RoadConfig {
  lanes?: number[];
  width?: number;
  length?: number;
  color?: number;
  emissive?: number;
  opacity?: number;
  yPosition?: number;
  segmentLength?: number;
  gap?: number;
  edgeOffset?: number;
  textureUrl?: string;
}

export interface SpeedLineConfig {
  count?: number;
  color?: number;
  length?: number;
  speed?: number;
  lanes?: number[];
}

export interface RoadStats {
  hasRoad: boolean;
  linesCount: number;
  speedLinesCount: number;
  edgesCount: number;
  lanesCount: number;
  sideObjectsCount: number;
  lanePositions: number[];
}
