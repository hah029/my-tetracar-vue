import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useCommonStore } from "./commonStore";
import { useLevelStore } from "@/store/levelStore";
import type { RoadConfig } from "@/game/environment/road";
import environmentConfig from "@/configs/environment";

export const useEnvironmentStore = defineStore("environmentStore", () => {
  const commonStore = useCommonStore();
  const levelStore = useLevelStore();
  const config = ref(environmentConfig);

  const defaultLanes = computed(() =>
    config.value.getDefaultLanes(
      commonStore.config.xzScaling,
      levelStore.currentGameplay.laneCount,
    ),
  );

  const defaultRoadConfig = computed<RoadConfig>(() => ({
    ...config.value.defaultRoadBase,
    lanes: defaultLanes.value,
  }));

  const neonRoadConfig = computed<RoadConfig>(() => ({
    ...defaultRoadConfig.value,
    ...config.value.neonRoadExtras,
  }));

  const currentRender = computed(() => levelStore.currentLevel.visual.render);
  const currentLighting = computed(
    () => levelStore.currentLevel.visual.lighting,
  );
  const currentRoad = computed(() => levelStore.currentLevel.environment.road);
  const currentScenery = computed(
    () => levelStore.currentLevel.environment.scenery,
  );
  const currentWeather = computed(
    () => levelStore.currentLevel.environment.weather,
  );

  function colorToNumber(color: string): number {
    return Number.parseInt(color.replace("#", ""), 16);
  }

  function getLevelRoadConfig(): RoadConfig {
    const road = currentRoad.value;
    const lanes =
      "lanes" in road && Array.isArray(road.lanes)
        ? (road.lanes as number[])
        : defaultLanes.value;
    const sideObjects = road.sideObjects
      ? {
          enabled: road.sideObjects.enabled,
          color: colorToNumber(road.sideObjects.color),
          emissive: road.sideObjects.emissiveColor
            ? colorToNumber(road.sideObjects.emissiveColor)
            : undefined,
          emissiveIntensity: road.sideObjects.emissiveIntensity,
          opacity: road.sideObjects.opacity,
          spacing: road.sideObjects.spacing,
          offset: road.sideObjects.offset,
          y: road.sideObjects.y,
          scale: road.sideObjects.scale,
        }
      : undefined;

    return {
      ...neonRoadConfig.value,
      lanes,
      length: road.length,
      color: colorToNumber(road.color),
      emissive: colorToNumber(road.emissiveColor),
      laneColor: colorToNumber(road.laneColor),
      emissiveIntensity: road.emissiveIntensity,
      opacity: road.opacity,
      sideObjects,
      roadMode: road.roadMode ?? "static",
      enableElevatedSegments: road.enableElevatedSegments ?? false,
      enableCurvedSegments: road.enableCurvedSegments ?? false,
      elevatedSections: road.elevatedSections?.map((section) => ({
        ...section,
        color: section.color ? colorToNumber(section.color) : undefined,
        emissive: section.emissiveColor
          ? colorToNumber(section.emissiveColor)
          : undefined,
      })),
    };
  }

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
    config,
    defaultRoadConfig,
    neonRoadConfig,
    currentRender,
    currentLighting,
    currentRoad,
    currentScenery,
    currentWeather,
    calculateRoadWidth,
    getEdgePositions,
    colorToNumber,
    getLevelRoadConfig,
  };
});
