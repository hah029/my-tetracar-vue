import type { TextureAtlas } from "@/assets/textures/TextureAtlas";

/** Rendering strategy for the main road surface. */
export type RoadMode = "static" | "segmented";

// Общие типы и интерфейсы
export interface RoadLineConfig {
  x: number;
  z: number;
  color?: number;
  emissive?: number;
  emissiveIntensity?: number;
  opacity?: number;
  length?: number;
}

export interface RoadLaneConfig {
  x: number;
  z: number;
  color?: number;
  emissive?: number;
  opacity?: number;
  length?: number;
  width?: number;
}

export interface RoadConfig {
  lanes: number[];
  width?: number;
  length: number;
  color?: number;
  emissive?: number;
  laneColor?: number;
  emissiveIntensity?: number;
  opacity?: number;
  yPosition?: number;
  gap?: number;
  edgeOffset?: number;
  textureUrl?: string;
  atlas?: TextureAtlas;
  atlasSprite?: string;
  sideObjects?: RoadSideObjectsConfig;
  lampPosts?: RoadLampPostsConfig;
  elevatedSections?: RoadElevatedSectionConfig[];
  /**
   * `static` keeps one large immovable surface. `segmented` creates and moves
   * runtime road sections together with gameplay segments.
   */
  roadMode?: RoadMode;
  /** Enables raised/lowered runtime sections. Requires `roadMode: "segmented"`. */
  enableElevatedSegments?: boolean;
  /** Enables curved runtime sections. Requires `roadMode: "segmented"`. */
  enableCurvedSegments?: boolean;
}

export interface RoadElevatedSectionConfig {
  lanes: number[];
  zStart: number;
  length: number;
  height: number;
  rampLength: number;
  rampIn?: boolean;
  rampOut?: boolean;
  speedFactor?: number;
  color?: number;
  emissive?: number;
  emissiveIntensity?: number;
  opacity?: number;
  loop?: boolean;
}

export interface RoadSideObjectsConfig {
  enabled: boolean;
  color: number;
  emissive?: number;
  emissiveIntensity?: number;
  opacity?: number;
  spacing: number;
  offset: number;
  y: number;
  scale: [number, number, number];
}

/** Decorative neon lamp posts placed outside both road edges. */
export interface RoadLampPostsConfig {
  enabled: boolean;
  color: number;
  opacity: number;
  spacing: number;
  offset: number;
  height: number;
  armLength: number;
  /** Angle between the upward pole direction and the arm, in degrees. */
  armAngleDeg: number;
  thickness: number;
}

export interface SpeedLineConfig {
  count?: number;
  color?: number;
  length?: number;
  speed?: number;
  lanes?: number[];
}

export interface RoadStats {
  hasRoad?: boolean;
  linesCount?: number;
  speedLinesCount?: number;
  edgesCount?: number;
  lanesCount?: number;
  sideObjectsCount?: number;
  lanePositions?: number[];
}
