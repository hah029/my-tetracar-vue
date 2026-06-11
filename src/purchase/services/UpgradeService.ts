// src/purchase/services/UpgradeService.ts
import { useMetaStore } from "@/store/metaStore";
import { usePlayerStore } from "@/store/playerStore";

class UpgradeServiceClass {
  /**
   * Применить апгрейд (повысить уровень)
   */
  applyUpgrade(effect: { upgrade: string; value: number; refill?: string }) {
    const meta = useMetaStore();
    meta.increaseUpgrade(effect.upgrade, effect.value);

    // Если апгрейд подразумевает пополнение — пополняем
    if (effect.refill) {
      this.applyConsumable({ refill: effect.refill });
    }
  }

  /**
   * Применить расходник (пополнение патронов/брони)
   */
  applyConsumable(effect: { refill: string }) {
    const meta = useMetaStore();
    const player = usePlayerStore();

    if (effect.refill === "ammo") {
      player.ammo = meta.maxAmmo;
    } else if (effect.refill === "armor") {
      player.armor = meta.maxArmor;
    }
  }
}

export const UpgradeService = new UpgradeServiceClass();
