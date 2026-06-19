// src/store/cameraStore.ts
import { defineStore } from "pinia";

import camera from "@/configs/camera";
import { ref } from "vue";

export const useCameraStore = defineStore("camera", () => {
  const config = ref(camera);

  return { config };
});
