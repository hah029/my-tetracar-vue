// src/purchase/services/EffectService.ts
import { useMetaStore, type TimedEffect } from "@/store/metaStore";

class EffectServiceClass {
  /**
   * Активировать временный эффект
   */
  activateTimedEffect(effect: {
    feature: string;
    value?: number;
    durationHours: number;
  }) {
    const meta = useMetaStore();
    const timedEffect: TimedEffect = {
      feature: effect.feature,
      value: effect.value,
      durationHours: effect.durationHours,
      expiresAt: Date.now() + effect.durationHours * 60 * 60 * 1000,
    };
    meta.addTimedEffect(timedEffect);
  }

  /**
   * Разблокировать постоянную возможность
   */
  unlockFeature(feature: string) {
    const meta = useMetaStore();
    meta.addPermanentFeature(feature);
  }

  /**
   * Проверить, активна ли возможность (permanent или timed не истёк)
   */
  isFeatureActive(feature: string): boolean {
    const meta = useMetaStore();
    return meta.isFeatureActive(feature);
  }

  /**
   * Очистить истёкшие эффекты
   */
  cleanupExpiredEffects() {
    const meta = useMetaStore();
    meta.cleanupExpiredEffects();
  }
}

export const EffectService = new EffectServiceClass();
