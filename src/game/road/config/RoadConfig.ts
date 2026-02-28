import { type RoadConfig } from "../types";

// Конфигурация по умолчанию
export const DEFAULT_LANES = [-4, -2, 0, 2, 4];

export const DEFAULT_ROAD_CONFIG: Required<RoadConfig> = {
  lanes: DEFAULT_LANES,
  width: 12, // Можно вычислять: (max lane - min lane) + edgeOffset*2
  length: 250,
  color: 0x88ccff,
  emissive: 0x224466,
  opacity: 0.6,
  yPosition: 0.0,
  segmentLength: 1.5,
  gap: 1.5,
  edgeOffset: 0, // Отступ от крайних полос до границ
};

export const NEON_ROAD_CONFIG: Required<RoadConfig> = {
  ...DEFAULT_ROAD_CONFIG,
  color: 0x3366aa,
  emissive: 0x112244,
  opacity: 0.5,
};

// Вспомогательная функция для вычисления ширины дороги
export function calculateRoadWidth(
  lanes: number[],
  edgeOffset: number,
): number {
  const minLane = Math.min(...lanes);
  const maxLane = Math.max(...lanes);
  return maxLane - minLane + edgeOffset * 2;
}

// Вспомогательная функция для получения позиций границ
export function getEdgePositions(
  lanes: number[],
  edgeOffset: number,
): { left: number; right: number } {
  const minLane = Math.min(...lanes);
  const maxLane = Math.max(...lanes);
  return {
    left: minLane - edgeOffset,
    right: maxLane + edgeOffset,
  };
}
