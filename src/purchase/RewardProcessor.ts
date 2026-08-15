// src/purchase/RewardProcessor.ts
import { InventoryService } from "./services/InventoryService";
import { UpgradeService } from "./services/UpgradeService";
import { EffectService } from "./services/EffectService";
import { WalletService } from "./services/WalletService";
import { usePlayerStore } from "@/store/playerStore";
import { useMetaStore } from "@/store/metaStore";

import type { RewardDefinition } from "./types";

export class RewardProcessor {
  static async apply(reward: RewardDefinition) {
    switch (reward.type) {
      case "cosmetic":
        return this.applyCosmetic(reward);

      case "upgrade":
        return this.applyUpgrade(reward);

      case "consumable":
        return this.applyConsumable(reward);

      case "timed_feature":
        return this.applyTimedFeature(reward);

      case "permanent_feature":
        return this.applyPermanentFeature(reward);

      case "currency":
        return this.applyCurrency(reward);

      case "ammo":
        return this.applyAmmo(reward);

      case "armor":
        return this.applyArmor(reward);

      case "fortune_spin":
        return this.applyFortuneSpin(reward);
    }
  }

  static async applyAll(rewards: readonly RewardDefinition[]) {
    for (const reward of rewards) await this.apply(reward);
  }

  private static applyCosmetic(reward: RewardDefinition) {
    InventoryService.unlockSkin(reward.effect.skinId);
  }

  private static applyUpgrade(reward: RewardDefinition) {
    UpgradeService.applyUpgrade(reward.effect);
  }

  private static applyConsumable(reward: RewardDefinition) {
    UpgradeService.applyConsumable(reward.effect);
  }

  private static applyTimedFeature(reward: RewardDefinition) {
    EffectService.activateTimedEffect(reward.effect);
  }

  private static applyPermanentFeature(reward: RewardDefinition) {
    EffectService.unlockFeature(reward.effect.feature);
  }

  private static applyCurrency(reward: RewardDefinition) {
    if (reward.effect?.currency && reward.effect?.amount) {
      WalletService.addCurrency(reward.effect.currency, reward.effect.amount);
    }
  }

  private static applyAmmo(reward: RewardDefinition) {
    const player = usePlayerStore();
    for (let i = 0; i < (Number(reward.effect?.amount) || 0); i++) player.addAmmo();
  }

  private static applyArmor(reward: RewardDefinition) {
    const player = usePlayerStore();
    for (let i = 0; i < (Number(reward.effect?.amount) || 0); i++) player.addArmor();
    if (player.armor > 0) player.enableShield();
  }

  private static applyFortuneSpin(reward: RewardDefinition) {
    useMetaStore().addFortuneSpins(Number(reward.effect?.amount) || 0);
  }
}
