import { defineStore } from "pinia";
import { ref, computed } from "vue";
import commonConfig from "@/configs/common";

export const useCommonStore = defineStore("common", () => {
  const config = ref(commonConfig);

  // Удобные ссылки на часто используемые значения
  const xzScaling = computed(() => config.value.xzScaling);
  const baseItemYpos = computed(() =>
    config.value.getBaseItemYpos(xzScaling.value),
  );

  // Геометрия предметов (зависит от XZ_SCALING)
  const itemGeometryConfig = computed(() =>
    config.value.getItemGeometryConfig(xzScaling.value),
  );

  // Параметры сегментов дороги
  const segmentRowLengths = computed(() =>
    config.value.getSegmentRowLengths(xzScaling.value),
  );

  // Формы препятствий
  const optimizedObstacleForms = computed(() =>
    config.value.getOptimizedObstacleForms(xzScaling.value, baseItemYpos.value),
  );
  const fullObstacleForms = computed(() =>
    config.value.getFullObstacleForms(xzScaling.value, baseItemYpos.value),
  );

  // Физический блок
  function getBasePhysics() {
    return config.value.physics;
  }

  return {
    // реактивный конфиг целиком
    config,
    baseItemYpos,
    segmentRowLengths,
    optimizedObstacleForms,
    fullObstacleForms,
    itemGeometryConfig,
    // методы
    getBasePhysics,
    getBulletGeometry: () => config.value.bulletGeometry,
  };
});
