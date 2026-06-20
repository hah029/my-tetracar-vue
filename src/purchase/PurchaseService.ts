// src/purchase/PurchaseService.ts
import { Platform } from "@/sdk/Platform";

import { WalletService } from "./services/WalletService";
import { RewardProcessor } from "./RewardProcessor";
import { useMetaStore } from "@/store/metaStore";

import type { Product, PurchaseTransaction } from "./types";
import { useProgressStore } from "@/store/progressStore";

export class PurchaseService {
  private platform = Platform.getInstance();

  /**
   * Защита от повторной обработки
   */
  private processedTransactions = new Set<string>();

  /**
   * Главная точка покупки
   */
  async purchase(product: Product) {
    try {
      // 0. Проверка: не куплен ли уже товар
      const checkResult = this.checkProductAvailability(product);
      if (!checkResult.available) {
        return {
          success: false,
          error: new Error(checkResult.reason),
        };
      }

      // 1. Оплата
      const transaction = await this.processPayment(product);

      // 2. Защита от дублей
      if (this.processedTransactions.has(transaction.id)) {
        return {
          success: true,
          duplicate: true,
        };
      }

      // 3. Применяем награду
      await RewardProcessor.apply(product);

      // 4. Помечаем transaction
      this.processedTransactions.add(transaction.id);

      // 5. consume для SDK purchases
      if (this.isExternalCurrency(product.price.currency)) {
        await this.platform.consumePrevPurchases(() => {
          console.log(`[PurchaseService] Consumed purchase: ${transaction.id}`);
        });
      }

      // 6. Сохраняем прогресс
      const meta = useMetaStore();
      await meta.saveProgress();

      return {
        success: true,
      };
    } catch (err) {
      console.error("[PurchaseService] purchase error:", err);

      return {
        success: false,
        error: err,
      };
    }
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
          if (
            meta.getUpgradeLevel(upgradeKey) >= meta.maxUpgrades[upgradeKey]
          ) {
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

  /**
   * Оплата товара
   */
  private async processPayment(product: Product): Promise<PurchaseTransaction> {
    const currency = product.price.currency;

    // External platform purchase
    if (this.isExternalCurrency(currency)) {
      const sdkTransaction = await this.platform.buyShopItem(
        product.id,
        (purchase: any) => {
          console.log(
            `[PurchaseService] Purchase callback: ${JSON.stringify(purchase)}`,
          );
        },
      );

      return {
        id: sdkTransaction?.transactionId ?? crypto.randomUUID(),

        productId: product.id,

        status: "completed",

        createdAt: Date.now(),
      };
    }

    // Internal currency purchase
    const success = WalletService.spendCurrency(currency, product.price.value);

    if (!success) {
      throw new Error("Not enough currency");
    }

    return {
      id: crypto.randomUUID(),

      productId: product.id,

      status: "completed",

      createdAt: Date.now(),
    };
  }

  private isExternalCurrency(currency: Product["price"]["currency"]): boolean {
    return currency !== "golden" && currency !== "energon";
  }
}
