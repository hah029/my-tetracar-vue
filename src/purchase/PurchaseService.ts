import { Platform } from "@/sdk/Platform";

import { WalletService } from "./services/WalletService";
import { RewardProcessor } from "./RewardProcessor";

import type { Product, PurchaseTransaction } from "./types";

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
      if (
        product.price.currency === "USD" ||
        product.price.currency === "EUR"
      ) {
        await this.platform.consumePrevPurchases(transaction);
      }

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
   * Оплата товара
   */
  private async processPayment(product: Product): Promise<PurchaseTransaction> {
    const currency = product.price.currency;

    // Real money purchase
    if (currency === "USD" || currency === "EUR") {
      const sdkTransaction = await this.platform.buyShopItem(product.id);

      return {
        id: sdkTransaction.transactionId ?? crypto.randomUUID(),

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
}
