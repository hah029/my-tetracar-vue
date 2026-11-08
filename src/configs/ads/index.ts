export const adsConfig = {
  interstitial: {
    // DEV включает реальный flow с Local mock-виджетом; production остаётся
    // выключенным до staging-проверки и отдельного продуктового включения.
    enabled: true,
    placement: "gameover_interstitial" as const,
    minCompletedRuns: 2,
    minIntervalMs: 90_000,
  },
  stickyBanner: {
    // Баннер не перекрывает gameplay. В production включается отдельно после
    // проверки placement-а и требований площадки.
    enabled: import.meta.env.DEV,
    placement: "sticky_banner" as const,
    showOn: "app_ready" as const,
  },
} as const;
