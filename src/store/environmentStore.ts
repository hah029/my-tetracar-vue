// src/store/gameState.ts
import { defineStore } from "pinia";
import { useCommonStore } from "./commonStore";
import type { RoadConfig } from "@/game/road";
import textureUrl from "@/assets/textures/road_tile.jpg";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import { usePlayerStore } from "./playerStore";

export const useEnvironmentStore = defineStore("environmentStore", () => {
  const commonStore = useCommonStore();
  const playerStore = usePlayerStore();
  const AXES_SIZE = 5;

  const DEFAULT_LANES = [
    -(12 * commonStore.XZ_SCALING),
    -(6 * commonStore.XZ_SCALING),
    0,
    6 * commonStore.XZ_SCALING,
    12 * commonStore.XZ_SCALING,
  ];

  const DEFAULT_ROAD_CONFIG: RoadConfig = {
    lanes: DEFAULT_LANES,
    // width: 11, // Можно вычислять: (max lane - min lane) + edgeOffset*2
    // width: 5.9,
    length: 500,
    color: 0x88ccff,
    emissive: 0x224466,
    opacity: 0.6,
    yPosition: 0.0,
    segmentLength: 500,
    gap: 0,
    edgeOffset: 0.3, // Отступ от крайних полос до границ
    textureUrl: textureUrl,
  };
  const NEON_ROAD_CONFIG: RoadConfig = {
    ...DEFAULT_ROAD_CONFIG,
    color: 0x3366aa,
    emissive: 0x112244,
    opacity: 0.5,
  };

  // Вспомогательная функция для вычисления ширины дороги
  function calculateRoadWidth(lanes: number[]): number {
    const minLane = Math.min(...lanes);
    const maxLane = Math.max(...lanes);
    return maxLane - minLane + commonStore.XZ_SCALING * 10;
  }

  // Вспомогательная функция для получения позиций границ
  function getEdgePositions(lanes: number[]): {
    left: number;
    right: number;
  } {
    const minLane = Math.min(...lanes);
    const maxLane = Math.max(...lanes);
    return {
      left: minLane - commonStore.XZ_SCALING * 3.5,
      right: maxLane + commonStore.XZ_SCALING * 3.5,
    };
  }

  const SIDE_OBJECT_GEOMETRY_CONFIG: GeometryConfig = {
    scale: [
      commonStore.XZ_SCALING,
      commonStore.XZ_SCALING,
      commonStore.XZ_SCALING,
    ],
    modelUrl: commonStore.cubeUrl,
  };

  const SIDE_OBJECT_MATERIAL_CONFIG: MaterialConfig = {
    textureUrl: commonStore.base_texture,
  };

  return {
    AXES_SIZE,
    DEFAULT_ROAD_CONFIG,
    DEFAULT_LANES,
    SIDE_OBJECT_GEOMETRY_CONFIG,
    SIDE_OBJECT_MATERIAL_CONFIG,
    calculateRoadWidth,
    getEdgePositions,
  };
});
