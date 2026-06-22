// src/store/cameraStore.ts
import { defineStore } from "pinia";
import { computed } from "vue";
import cameraConfig from "@/configs/camera";
import { useLevelStore } from "@/store/levelStore";

export const useCameraStore = defineStore("camera", () => {
  const levelStore = useLevelStore();

  const config = computed(() => {
    const levelCamera = levelStore.currentLevel.visual.camera;

    return {
      ...cameraConfig,
      settings: {
        ...cameraConfig.settings,
        height: levelCamera.height,
        distance: levelCamera.distance,
        lookahead: levelCamera.lookahead,
        follow_speed: levelCamera.followSpeed,
        distance_reduction_factor: levelCamera.distanceReductionFactor,
      },
      fov: {
        ...cameraConfig.fov,
        min: levelCamera.fov,
        max: levelCamera.fovMax,
      },
      tilt: {
        ...cameraConfig.tilt,
        factor: levelCamera.tilt,
      },
    };
  });

  return { config };
});
