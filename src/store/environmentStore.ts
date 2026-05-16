// src/store/gameState.ts
import { defineStore } from "pinia";
import { useCommonStore } from "./commonStore";
import type { RoadConfig } from "@/game/road";
import textureUrl from "@/assets/textures/road_tile.svg";
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import { MODELS } from "@/assets/models";
import { TEXTURES } from "@/assets/textures";

export const useEnvironmentStore = defineStore("environmentStore", () => {
  const commonStore = useCommonStore();
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
    length: 800,
    color: 0x88ccff,
    emissive: 0x224466,
    opacity: 0.8,
    yPosition: 0.0,
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
      // commonStore.XZ_SCALING,
      // commonStore.XZ_SCALING,
      // commonStore.XZ_SCALING,
      2, 2, 2,
    ],
    modelUrl: MODELS.cube,
  };

  const SIDE_OBJECT_MATERIAL_CONFIG: MaterialConfig = {
    textureUrl: TEXTURES.cube.base,
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
