// src/purchase/services/WalletService.ts
import { useMetaStore } from "@/store/metaStore";

class WalletServiceClass {
  /**
   * Проверить, хватает ли валюты
   */
  hasEnoughCurrency(currency: string, amount: number): boolean {
    const meta = useMetaStore();
    if (currency === "golden") {
      return meta.goldens >= amount;
    }
    if (currency === "energon") {
      return meta.energons >= amount;
    }
    return false;
  }

  /**
   * Списать валюту
   */
  spendCurrency(currency: string, amount: number): boolean {
    const meta = useMetaStore();
    if (currency === "golden") {
      return meta.spendGolden(amount);
    }
    if (currency === "energon") {
      return meta.spendEnergon(amount);
    }
    return false;
  }

  /**
   * Добавить валюту
   */
  addCurrency(currency: string, amount: number) {
    const meta = useMetaStore();
    if (currency === "golden") {
      meta.addGolden(amount);
    } else if (currency === "energon") {
      meta.addEnergon(amount);
    }
  }
}

export const WalletService = new WalletServiceClass();
