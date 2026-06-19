import type {
  SDK,
  Player,
  LeaderboardEntriesData,
  Product,
  Serializable,
} from "ysdk";
import type { IGamePlatform } from "../IGamePlatform";

type Stats = Record<string | number, number>;
type PlayerData = Serializable | undefined;
type PlayerDataSet = Record<string, PlayerData>;

// ------------------------------------------------------------------
// YandexPlatform
// ------------------------------------------------------------------
export class YandexPlatform implements IGamePlatform {
  private sdk: SDK | null = null;

  async init(): Promise<void> {
    this.sdk = await YaGames.init();
  }

  // Приватные хелперы – единая точка проверки наличия SDK / игрока
  private ensureSDK(): SDK {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }
    return this.sdk;
  }

  private async getPlayerSafe(): Promise<Player | null> {
    try {
      return await this.ensureSDK().getPlayer();
    } catch {
      return null;
    }
  }

  // ------------------------------------------------------------------
  // Реклама
  // ------------------------------------------------------------------
  async showFullscreenAd(
    callbackObject: any,
    openCallbackMethod?: Function,
    closeCallbackMethod?: Function,
  ): Promise<void> {
    const sdk = this.ensureSDK();
    sdk.adv.showFullscreenAdv({
      callbacks: {
        onOpen: () => {
          console.log("Fullscreen Ad opened");
          openCallbackMethod?.(callbackObject);
        },
        onClose: () => {
          console.log("Fullscreen Ad closed");
          closeCallbackMethod?.(callbackObject);
        },
        onError: () => closeCallbackMethod?.(callbackObject),
      },
    });
  }

  async showRewardedVideoAd(
    callbackObject: any,
    openCallbackMethod?: Function,
    rewardCallbackMethod?: Function,
    closeCallbackMethod?: Function,
  ): Promise<void> {
    const sdk = this.ensureSDK();
    sdk.adv.showRewardedVideo({
      callbacks: {
        onOpen: () => {
          console.log("Rewarded Ad opened");
          openCallbackMethod?.(callbackObject);
        },
        onClose: () => console.log("Rewarded Ad closed"),
        onRewarded: () => rewardCallbackMethod?.(callbackObject),
        onError: (err) => {
          console.error("Rewarded Ad error", err);
          closeCallbackMethod?.(callbackObject);
        },
      },
    });
  }

  // ------------------------------------------------------------------
  // Игрок – авторизация, имя, id
  // ------------------------------------------------------------------
  async isPlayerAuthorized(): Promise<boolean | null> {
    const player = await this.getPlayerSafe();
    return player ? player.isAuthorized() : null;
  }

  async getPlayerId(): Promise<string | null> {
    const player = await this.getPlayerSafe();
    return player ? player.getUniqueID() : null;
  }

  async getPlayerName(): Promise<string | null> {
    const player = await this.getPlayerSafe();
    return player ? player.getName() : null;
  }

  // ------------------------------------------------------------------
  // Статистика игрока
  // ------------------------------------------------------------------
  async getPlayerStats(keys?: string[]): Promise<Partial<Stats> | null> {
    const player = await this.getPlayerSafe();
    if (!player) return null;
    return keys ? player.getStats(keys) : player.getStats();
  }

  async setPlayerStats(stats: Stats): Promise<void> {
    const player = await this.getPlayerSafe();
    if (!player) throw new Error("Player not available");
    try {
      await player.setStats(stats);
    } catch (err) {
      console.error("[YandexPlatfrom.setPlayerStats]", err);
    }
  }

  async setPlayerStatByKey(stat: string, value: number): Promise<void> {
    return this.setPlayerStats({ [stat]: value });
  }

  async getPlayerStatByKey(key: string): Promise<number> {
    if (!key) return 0;
    const player = await this.getPlayerSafe();
    if (!player) return 0;
    try {
      const stats = await player.getStats([key]);
      // stats – объект вида { [key]: number } или undefined
      console.log("[YandexPlatform.getPlayerStatByKey.stats]", stats);

      const val = stats?.[key];
      return typeof val === "number" && !isNaN(val) ? val : 0;
    } catch (e) {
      console.error("getPlayerStatByKey error:", e);
      return 0;
    }
  }

  // ------------------------------------------------------------------
  // Данные игрока
  // ------------------------------------------------------------------
  async getPlayerData(): Promise<PlayerDataSet | null> {
    const player = await this.getPlayerSafe();
    return player ? player.getData() : null;
  }

  async getPlayerDataByKey(key: string): Promise<PlayerData | null> {
    const player = await this.getPlayerSafe();
    if (!player) return null;
    const data = await player.getData();
    return key in data ? data[key] : null;
  }

  async setPlayerData(data: PlayerDataSet): Promise<void> {
    const player = await this.getPlayerSafe();
    if (!player) throw new Error("Player not available");
    await player.setData(data);
  }

  async setPlayerDataByKey(key: string, value: PlayerData): Promise<void> {
    const player = await this.getPlayerSafe();
    if (!player) throw new Error("Player not available");
    const data = await player.getData();
    data[key] = value;
    try {
      await player.setData(data);
    } catch (err: any) {
      // Яндекс SDK может выбрасывать ошибку, если данные не изменились
      if (err?.message?.includes("does not differ")) {
        console.log(
          `[Yandex] setPlayerDataByKey("${key}"): данные не изменились, пропускаем`,
        );
        return;
      }
      throw err;
    }
  }

  // ------------------------------------------------------------------
  // Лидерборды
  // ------------------------------------------------------------------
  async getLeaderboardEntries(
    leaderboardName: string,
    quantityTop: number,
    includeUser: boolean,
    quantityAround: number,
  ): Promise<LeaderboardEntriesData | null> {
    const sdk = this.ensureSDK();
    return sdk.leaderboards.getEntries(leaderboardName, {
      quantityTop,
      includeUser,
      quantityAround,
    });
  }

  async setLeaderboardScore(
    leaderboardName: string,
    score: number,
  ): Promise<void> {
    const sdk = this.ensureSDK();
    await sdk.leaderboards.setScore(leaderboardName, score);
  }

  // ------------------------------------------------------------------
  // Язык и готовность игры
  // ------------------------------------------------------------------
  getLocale(): string | undefined {
    return this.sdk?.environment.i18n.lang;
  }

  gameReady(): void {
    this.sdk?.features.LoadingAPI.ready();
  }

  // ------------------------------------------------------------------
  // Платежи и покупки
  // ------------------------------------------------------------------
  async consumePrevPurchases(consumePurchaseCallback: Function): Promise<void> {
    const sdk = this.ensureSDK();
    const payments = await sdk.getPayments();
    if (!payments) return;

    const purchases = await payments.getPurchases(); // <-- было this.sdk.payments (ошибка)
    console.log("Purchases to consume:", purchases);

    for (const purchase of purchases) {
      this.consumePurchaseCore(payments, purchase, consumePurchaseCallback);
    }
  }

  private consumePurchaseCore(
    payments: any, // Payments API объект
    purchase: any, // объект покупки { productID, purchaseToken, ... }
    callback: Function,
  ): void {
    console.log("consumePurchase:", purchase);
    callback?.(purchase); // игровая логика начисления предметов
    payments.consumePurchase(purchase.purchaseToken);
    console.log("consumePurchase completed:", purchase.purchaseToken);
  }

  async getShopCatalog(): Promise<Product[] | null> {
    const sdk = this.ensureSDK();
    const payments = await sdk.getPayments();
    if (!payments) return null;
    const catalog = await payments.getCatalog();
    console.log("Catalog:", catalog);
    return catalog;
  }

  async buyShopItem(
    productId: string,
    consumePurchase: Function,
  ): Promise<void> {
    const sdk = this.ensureSDK();
    const payments = await sdk.getPayments();
    if (!payments) throw new Error("Payments not available");
    try {
      const purchase = await payments.purchase({ id: productId });
      this.consumePurchaseCore(payments, purchase, consumePurchase);
    } catch (err) {
      console.error("Purchase error:", err);
      throw err; // даём вызывающему коду обработать ошибку
    }
  }
}
