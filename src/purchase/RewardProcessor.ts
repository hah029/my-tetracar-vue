// src/purchase/RewardProcessor.ts
import { InventoryService } from "./services/InventoryService";
import { UpgradeService } from "./services/UpgradeService";
import { EffectService } from "./services/EffectService";
import { WalletService } from "./services/WalletService";

import type { Product } from "./types";

export class RewardProcessor {
  static async apply(product: Product) {
    switch (product.type) {
      case "cosmetic":
        return this.applyCosmetic(product);

      case "upgrade":
        return this.applyUpgrade(product);

      case "consumable":
        return this.applyConsumable(product);

      case "timed_feature":
        return this.applyTimedFeature(product);

      case "permanent_feature":
        return this.applyPermanentFeature(product);

      case "currency":
        return this.applyCurrency(product);
    }
  }

  private static applyCosmetic(product: Product) {
    InventoryService.unlockSkin(product.effect.skinId);
  }

  private static applyUpgrade(product: Product) {
    UpgradeService.applyUpgrade(product.effect);
  }

  private static applyConsumable(product: Product) {
    UpgradeService.applyConsumable(product.effect);
  }

  private static applyTimedFeature(product: Product) {
    EffectService.activateTimedEffect(product.effect);
  }

  private static applyPermanentFeature(product: Product) {
    EffectService.unlockFeature(product.effect.feature);
  }

  private static applyCurrency(product: Product) {
    // Например, покупка пачки голденов или энергонов
    if (product.effect?.currency && product.effect?.amount) {
      WalletService.addCurrency(product.effect.currency, product.effect.amount);
    }
  }
}
