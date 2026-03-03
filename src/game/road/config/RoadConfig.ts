import { XZ_SCALING } from "@/game/cube/config";
import { type RoadConfig } from "../types";

import textureUrl from "@/assets/textures/road_tile.jpg";

// Конфигурация по умолчанию
export const DEFAULT_LANES = [
  -(12 * XZ_SCALING),
  -(6 * XZ_SCALING),
  0,
  6 * XZ_SCALING,
  12 * XZ_SCALING,
];

export const DEFAULT_ROAD_CONFIG: RoadConfig = {
  lanes: DEFAULT_LANES,
  // width: 11, // Можно вычислять: (max lane - min lane) + edgeOffset*2
  // width: 5.9,
  length: 250,
  color: 0x88ccff,
  emissive: 0x224466,
  opacity: 0.6,
  yPosition: 0.0,
  segmentLength: 250,
  gap: 0,
  edgeOffset: 0.3, // Отступ от крайних полос до границ
  textureUrl: textureUrl,
};

export const NEON_ROAD_CONFIG: RoadConfig = {
  ...DEFAULT_ROAD_CONFIG,
  color: 0x3366aa,
  emissive: 0x112244,
  opacity: 0.5,
};

// Вспомогательная функция для вычисления ширины дороги
export function calculateRoadWidth(lanes: number[]): number {
  const minLane = Math.min(...lanes);
  const maxLane = Math.max(...lanes);
  return maxLane - minLane + XZ_SCALING * 10;
}

// Вспомогательная функция для получения позиций границ
export function getEdgePositions(lanes: number[]): {
  left: number;
  right: number;
} {
  const minLane = Math.min(...lanes);
  const maxLane = Math.max(...lanes);
  return {
    left: minLane - XZ_SCALING * 3.5,
    right: maxLane + XZ_SCALING * 3.5,
  };
}
