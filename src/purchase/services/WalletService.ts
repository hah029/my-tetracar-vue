class WalletServiceClass {
  golden = 0;

  energon = 0;

  hasEnoughCurrency(currency: string, amount: number) {
    return this[currency] >= amount;
  }

  spendCurrency(currency: string, amount: number) {
    if (!this.hasEnoughCurrency(currency, amount)) {
      return false;
    }

    this[currency] -= amount;

    return true;
  }

  addCurrency(currency: string, amount: number) {
    this[currency] += amount;
  }
}

export const WalletService = new WalletServiceClass();
