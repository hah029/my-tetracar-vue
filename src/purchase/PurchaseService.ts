// src/purchase/PurchaseService.ts
import { Platform } from "@/sdk/Platform";
import type { PlatformPurchase } from "@/sdk/IGamePlatform";

import { WalletService } from "./services/WalletService";
import { RewardProcessor } from "./RewardProcessor";
import { useMetaStore } from "@/store/metaStore";

import currencyProducts from "@/configs/in_apps/currency.json";
import stuffProducts from "@/configs/in_apps/stuff.json";
import visualProducts from "@/configs/in_apps/visual.json";
import type { Product } from "./types";
import { useProgressStore } from "@/store/progressStore";
import { Telemetry } from "@/telemetry";

export class PurchaseService {
  private platform = Platform.getInstance();

  /**
   * Главная точка покупки
   */
  async purchase(product: Product) {
    Telemetry.emit({
      type: "economy.purchase_started",
      productId: product.id,
      currency: product.price.currency,
      amount: product.price.value,
    });
    try {
      // 0. Проверка: не куплен ли уже товар
      const checkResult = this.checkProductAvailability(product);
      if (!checkResult.available) {
        Telemetry.emit({
          type: "economy.purchase_failed",
          productId: product.id,
          reason: checkResult.reason ?? "unavailable",
        });
        return {
          success: false,
          error: new Error(checkResult.reason),
        };
      }

      // 1. Оплата
      if (this.isExternalCurrency(product.price.currency)) {
        const receipt = await this.platform.buyShopItem(product.id);
        await this.fulfillExternalPurchase(product, receipt);
      } else {
        const success = WalletService.spendCurrency(product.price.currency, product.price.value);
        if (!success) throw new Error("Not enough currency");
        await RewardProcessor.apply(product);
        await this.persistReward();
      }

      Telemetry.emit({ type: "economy.purchase_completed", productId: product.id, currency: product.price.currency, amount: product.price.value });

      return {
        success: true,
      };
    } catch (err) {
      console.error("[PurchaseService] purchase error:", err);
      Telemetry.emit({
        type: "economy.purchase_failed",
        productId: product.id,
        reason: err instanceof Error ? err.message : "unknown_error",
      });

      return {
        success: false,
        error: err,
      };
    }
  }

  async recoverPendingPurchases(): Promise<void> {
    let purchases: PlatformPurchase[];
    try {
      purchases = await this.platform.getPendingPurchases();
    } catch (error) {
      console.error("[PurchaseService] Failed to load pending purchases:", error);
      return;
    }

    for (const receipt of purchases) {
      const product = this.findProduct(receipt.productID);
      if (!product) {
        console.error(`[PurchaseService] Unknown pending product: ${receipt.productID}`);
        continue;
      }
      try {
        await this.fulfillExternalPurchase(product, receipt);
      } catch (error) {
        console.error(`[PurchaseService] Failed to recover ${receipt.purchaseToken}:`, error);
      }
    }
  }

  private async fulfillExternalPurchase(
    product: Product,
    receipt: PlatformPurchase,
  ): Promise<void> {
    const meta = useMetaStore();
    const existing = meta.getIapReceipt(receipt.purchaseToken);

    if (existing && existing.productId !== product.id) {
      throw new Error("Purchase token belongs to another product");
    }

    if (!existing) {
      await RewardProcessor.apply(product);
      await this.persistReward();
      meta.setIapReceipt(receipt.purchaseToken, product.id, "granted");
      await meta.saveProgress();
    }

    if (meta.getIapReceipt(receipt.purchaseToken)?.status === "consumed") return;

    await this.platform.consumePurchase(receipt.purchaseToken);
    meta.setIapReceipt(receipt.purchaseToken, product.id, "consumed");
    await meta.saveProgress();
  }

  private async persistReward(): Promise<void> {
    await useProgressStore().saveArmorAndAmmo();
    await useMetaStore().saveProgress();
  }

  private findProduct(productId: string): Product | undefined {
    return ([...currencyProducts, ...stuffProducts, ...visualProducts] as Product[]).find(
      (product) => product.id === productId,
    );
  }

  /**
   * Проверка, доступен ли товар для покупки
   */
  private checkProductAvailability(product: Product): {
    available: boolean;
    reason?: string;
  } {
    const meta = useMetaStore();
    const progress = useProgressStore();

    switch (product.type) {
      case "cosmetic": {
        const skinId = product.effect?.skinId;
        if (skinId && meta.isSkinOwned(skinId)) {
          return { available: false, reason: "already_owned" };
        }
        break;
      }

      case "permanent_feature": {
        const feature = product.effect?.feature;
        if (feature && meta.hasPermanentFeature(feature)) {
          return { available: false, reason: "already_owned" };
        }
        break;
      }

      case "timed_feature": {
        const feature = product.effect?.feature;
        const durationHours = product.effect?.durationHours;

        // Если есть permanent-версия — уже owned
        if (feature && meta.hasPermanentFeature(feature)) {
          return { available: false, reason: "already_owned" };
        }

        // Если есть активный timed-эффект с той же или большей длительностью
        if (feature && durationHours) {
          const activeTimed = meta.getTimedEffect(feature);
          if (activeTimed && activeTimed.durationHours >= durationHours) {
            return { available: false, reason: "already_owned" };
          }
        }
        break;
      }

      case "upgrade": {
        const upgradeKey = product.effect?.upgrade;
        if (upgradeKey) {
          const maxLevel = meta.getMaxUpgradeLevel(upgradeKey);
          if (maxLevel !== undefined && meta.getUpgradeLevel(upgradeKey) >= maxLevel) {
            return { available: false, reason: "max_level" };
          }
        }
        break;
      }

      case "consumable": {
        const refillType = product.effect?.refill;
        if (refillType) {
          if (progress.checkFullFilling(refillType)) {
            return { available: false, reason: "max_fill" };
          }
        }
      }
    }

    return { available: true };
  }

  private isExternalCurrency(currency: Product["price"]["currency"]): boolean {
    return currency !== "golden" && currency !== "energon";
  }
}
