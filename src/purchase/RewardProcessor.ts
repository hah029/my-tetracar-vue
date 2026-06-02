import { InventoryService } from "../inventory/InventoryService";

import { UpgradeService } from "../upgrades/UpgradeService";

import { EffectService } from "../effects/EffectService";

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
    // например golden pack
  }
}
