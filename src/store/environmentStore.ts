import { defineStore } from "pinia";
import { ref } from "vue";
import { useCommonStore } from "./commonStore";
import type { RoadConfig } from "@/game/environment/road";
import environmentConfig from "@/configs/environment";

export const useEnvironmentStore = defineStore("environmentStore", () => {
  const commonStore = useCommonStore();
  const config = ref(environmentConfig);

  // Вычисляем lanes с учётом текущего XZ_SCALING
  const defaultLanes = config.value.getDefaultLanes(
    commonStore.config.xzScaling,
  );

  // Собираем полные конфиги дорог
  const defaultRoadConfig: RoadConfig = {
    ...config.value.defaultRoadBase,
    lanes: defaultLanes,
  };

  const neonRoadConfig: RoadConfig = {
    ...defaultRoadConfig,
    ...config.value.neonRoadExtras,
  };

  // Вспомогательные функции (зависят от XZ_SCALING)
  function calculateRoadWidth(lanes: number[]): number {
    const minLane = Math.min(...lanes);
    const maxLane = Math.max(...lanes);
    return maxLane - minLane + commonStore.config.xzScaling * 10;
  }

  function getEdgePositions(lanes: number[]): {
    left: number;
    right: number;
  } {
    const minLane = Math.min(...lanes);
    const maxLane = Math.max(...lanes);
    return {
      left: minLane - commonStore.config.xzScaling * 3.5,
      right: maxLane + commonStore.config.xzScaling * 3.5,
    };
  }

  return {
    config, // единый реактивный конфиг
    defaultRoadConfig,
    neonRoadConfig,
    calculateRoadWidth,
    getEdgePositions,
  };
});
