// src/purchase/RewardProcessor.ts
import { InventoryService } from "./services/InventoryService";
import { UpgradeService } from "./services/UpgradeService";
import { EffectService } from "./services/EffectService";
import { WalletService } from "./services/WalletService";
import { usePlayerStore } from "@/store/playerStore";
import { useMetaStore } from "@/store/metaStore";

import metaConfig from "@/configs/meta";

import type { RewardDefinition } from "./types";

export class RewardProcessor {
  static resolve(reward: RewardDefinition): RewardDefinition | null {
    const meta = useMetaStore();
    const alreadyClaimed = reward.onceKey && meta.claimedRewardKeys.includes(reward.onceKey);
    const unavailableSkin = reward.type === "cosmetic" &&
      (!reward.effect.skinId || reward.effect.skinId === "???" || InventoryService.isSkinOwned(reward.effect.skinId));
    const maxLevel = metaConfig.max_upgrades[reward.effect?.upgrade as keyof typeof metaConfig.max_upgrades];
    const cappedUpgrade = reward.type === "upgrade" &&
      (maxLevel === undefined || meta.getUpgradeLevel(reward.effect.upgrade) >= maxLevel);
    if (alreadyClaimed || unavailableSkin || cappedUpgrade) {
      return reward.fallback ? this.resolve(reward.fallback) : null;
    }
    return reward;
  }

  static async apply(reward: RewardDefinition) {
    const resolved = this.resolve(reward);
    if (!resolved) return;
    await this.applyResolved(resolved);
    if (reward.onceKey && resolved === reward) {
      const meta = useMetaStore();
      if (!meta.claimedRewardKeys.includes(reward.onceKey)) meta.claimedRewardKeys.push(reward.onceKey);
    }
  }

  private static async applyResolved(reward: RewardDefinition) {
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
    const wasUpgraded = UpgradeService.applyUpgrade(reward.effect);
    if (!wasUpgraded && reward.fallback) {
      return this.apply(reward.fallback);
    }
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
    useMetaStore().addFortuneSpins(reward.effect.presetId, Number(reward.effect.amount) || 0);
  }
}
