// src/purchase/services/UpgradeService.ts
import { useMetaStore } from "@/store/metaStore";
import { usePlayerStore } from "@/store/playerStore";

class UpgradeServiceClass {
  /**
   * Применить апгрейд (повысить уровень)
   */
  applyUpgrade(effect: { upgrade: string; value: number; refill?: string }): boolean {
    const meta = useMetaStore();
    const levelBefore = meta.getUpgradeLevel(effect.upgrade);
    meta.increaseUpgrade(effect.upgrade, effect.value);
    const wasUpgraded = meta.getUpgradeLevel(effect.upgrade) > levelBefore;

    // Если апгрейд подразумевает пополнение — пополняем
    if (wasUpgraded && effect.refill) {
      this.applyConsumable({ refill: effect.refill });
    }

    return wasUpgraded;
  }

  /**
   * Применить расходник (пополнение патронов/брони)
   */
  applyConsumable(effect: { refill: string }) {
    const meta = useMetaStore();
    const player = usePlayerStore();

    if (effect.refill === "ammo") {
      player.fillAmmo();
    } else if (effect.refill === "armor") {
      while (player.armor < meta.maxArmor) {
        player.addArmor();
      }
      // Включаем флаг щита, чтобы броня работала при столкновениях
      if (player.armor > 0) {
        player.enableShield();
      }
    }
  }
}

export const UpgradeService = new UpgradeServiceClass();
