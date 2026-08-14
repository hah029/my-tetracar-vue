export type shadowQualityTypes = "low" | "medium" | "high";

export default {
  // Не рендерим ниже нативного CSS-разрешения: на дисплеях с высоким DPR
  // это особенно заметно как размытость. 1.5 — компромисс между чёткостью
  // и нагрузкой GPU по сравнению с полным DPR=2.
  pixel_ratio: { enabled: 1.5, disabled: 1.0 },
  bloom_strength: { enabled: 0.3, disabled: 0.0 },
};
