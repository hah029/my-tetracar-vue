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

type Purchase = {
  productID: string;
  purchaseToken: string;
};

type Payments = Awaited<ReturnType<SDK["getPayments"]>>;

// ------------------------------------------------------------------
// YandexPlatform
// ------------------------------------------------------------------
export class YandexPlatform implements IGamePlatform {
  private sdk: SDK | null = null;
  private player: Player | null = null;
  private playerDataCache: PlayerDataSet | null = null;
  private isPlayerDataCacheComplete = false;

  async init(): Promise<void> {
    this.sdk = await YaGames.init();
    this.sdk.features.LoadingAPI?.ready();
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private ensureSDK(): SDK {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }

    return this.sdk;
  }

  private async getPlayerSafe(): Promise<Player | null> {
    try {
      if (this.player != null) return this.player;

      this.player = await this.ensureSDK().getPlayer();
      return this.player;
    } catch {
      return null;
    }
  }

  private async ensurePlayerDataCache(): Promise<PlayerDataSet | null> {
    if (this.playerDataCache) {
      return this.playerDataCache;
    }

    const player = await this.getPlayerSafe();

    if (!player) {
      return null;
    }

    this.playerDataCache = await player.getData();
    this.isPlayerDataCacheComplete = true;

    return this.playerDataCache;
  }

  private async requirePlayer(): Promise<Player> {
    const player = await this.getPlayerSafe();

    if (!player) {
      throw new Error("Player not available");
    }

    return player;
  }

  private async requirePayments(): Promise<Payments> {
    const payments = await this.ensureSDK().getPayments();

    if (!payments) {
      throw new Error("Payments not available");
    }

    return payments;
  }

  // ------------------------------------------------------------------
  // Ads
  // ------------------------------------------------------------------

  showFullscreenAd(
    callbackObject: any,
    openCallbackMethod?: Function,
    closeCallbackMethod?: Function,
  ): void {
    this.ensureSDK().adv.showFullscreenAdv({
      callbacks: {
        onOpen: () => {
          console.log("Fullscreen Ad opened");
          openCallbackMethod?.(callbackObject);
        },

        onClose: () => {
          console.log("Fullscreen Ad closed");
          closeCallbackMethod?.(callbackObject);
        },

        onError: (err) => {
          console.error("Fullscreen Ad error:", err);
          closeCallbackMethod?.(callbackObject);
        },
      },
    });
  }

  showRewardedVideoAd(
    callbackObject: any,
    openCallbackMethod?: Function,
    rewardCallbackMethod?: Function,
    closeCallbackMethod?: Function,
  ): void {
    this.ensureSDK().adv.showRewardedVideo({
      callbacks: {
        onOpen: () => {
          console.log("Rewarded Ad opened");
          openCallbackMethod?.(callbackObject);
        },

        onRewarded: () => {
          rewardCallbackMethod?.(callbackObject);
        },

        onClose: () => {
          console.log("Rewarded Ad closed");
        },

        onError: (err) => {
          console.error("Rewarded Ad error:", err);
          closeCallbackMethod?.(callbackObject);
        },
      },
    });
  }

  // ------------------------------------------------------------------
  // Player
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
  // Stats
  // ------------------------------------------------------------------

  async getPlayerStats(keys?: string[]): Promise<Partial<Stats> | null> {
    const player = await this.getPlayerSafe();

    if (!player) {
      return null;
    }

    try {
      return keys ? player.getStats(keys) : player.getStats();
    } catch (err) {
      console.error("[YandexPlatform.getPlayerStats]", err);
      return null;
    }
  }

  async setPlayerStats(stats: Stats): Promise<void> {
    if (!stats || Object.keys(stats).length === 0) {
      return;
    }

    const player = await this.requirePlayer();

    try {
      await player.setStats(stats);
    } catch (err) {
      console.error("[YandexPlatform.setPlayerStats]", err);
    }
  }

  async setPlayerStatByKey(key: string, value: number): Promise<void> {
    await this.setPlayerStats({ [key]: value });
  }

  async getPlayerStatByKey(key: string): Promise<number> {
    if (!key) {
      return 0;
    }

    const stats = await this.getPlayerStats([key]);
    const value = stats?.[key];

    return typeof value === "number" && !Number.isNaN(value) ? value : 0;
  }

  // ------------------------------------------------------------------
  // Player Data
  // ------------------------------------------------------------------

  async getPlayerData(): Promise<PlayerDataSet | null> {
    return this.ensurePlayerDataCache();
  }

  async getPlayerDataByKey(key: string): Promise<PlayerData | null> {
    const player = await this.getPlayerSafe();

    if (!player) {
      return null;
    }

    if (this.playerDataCache && key in this.playerDataCache) {
      return this.playerDataCache[key];
    }

    if (this.isPlayerDataCacheComplete) {
      return null;
    }

    const data = await player.getData([key]);
    this.playerDataCache = { ...(this.playerDataCache ?? {}), ...data };

    return key in data ? data[key] : null;
  }

  async setPlayerData(data: PlayerDataSet): Promise<void> {
    if (!data || Object.keys(data).length === 0) {
      return;
    }

    const player = await this.requirePlayer();
    const currentData = await this.ensurePlayerDataCache();
    const nextData = { ...(currentData ?? {}), ...data };

    try {
      await player.setData(nextData);
      this.playerDataCache = nextData;
      this.isPlayerDataCacheComplete = true;
    } catch (err: any) {
      if (err?.message?.includes("does not differ")) {
        this.playerDataCache = nextData;
        this.isPlayerDataCacheComplete = true;
        return;
      }

      throw err;
    }
  }

  async setPlayerDataByKey(key: string, value: PlayerData): Promise<void> {
    await this.setPlayerData({ [key]: value });
  }

  // ------------------------------------------------------------------
  // Leaderboards
  // ------------------------------------------------------------------

  async getLeaderboardEntries(
    leaderboardName: string,
    quantityTop: number,
    includeUser: boolean,
    quantityAround: number,
  ): Promise<LeaderboardEntriesData | null> {
    return this.ensureSDK().leaderboards.getEntries(leaderboardName, {
      quantityTop,
      includeUser,
      quantityAround,
    });
  }

  async setLeaderboardScore(
    leaderboardName: string,
    score: number,
  ): Promise<void> {
    await this.ensureSDK().leaderboards.setScore(leaderboardName, score);
  }

  // ------------------------------------------------------------------
  // Localization
  // ------------------------------------------------------------------

  getLocale(): string | undefined {
    return this.sdk?.environment.i18n.lang;
  }

  gameReady(): void {
    this.sdk?.features.LoadingAPI.ready();
  }

  gameStart(): void {
    this.sdk?.features.GameplayAPI.start();
  }

  gameStop(): void {
    this.sdk?.features.GameplayAPI.stop();
  }

  // ------------------------------------------------------------------
  // Payments
  // ------------------------------------------------------------------

  async consumePrevPurchases(
    consumePurchaseCallback: (purchase: Purchase) => void,
  ): Promise<void> {
    const payments = await this.requirePayments();

    const purchases = (await payments.getPurchases()) as Purchase[];

    console.log("Purchases to consume:", purchases);

    for (const purchase of purchases) {
      await this.consumePurchaseCore(
        payments,
        purchase,
        consumePurchaseCallback,
      );
    }
  }

  private async consumePurchaseCore(
    payments: Payments,
    purchase: Purchase,
    callback?: (purchase: Purchase) => void,
  ): Promise<void> {
    console.log("consumePurchase:", purchase);

    callback?.(purchase);

    await payments.consumePurchase(purchase.purchaseToken);

    console.log("consumePurchase completed:", purchase.purchaseToken);
  }

  async getShopCatalog(): Promise<Product[] | null> {
    const payments = await this.requirePayments();

    const catalog = await payments.getCatalog();

    console.log("Catalog:", catalog);

    return catalog;
  }

  async buyShopItem(
    productId: string,
    consumePurchase: (purchase: Purchase) => void,
  ): Promise<void> {
    const payments = await this.requirePayments();

    try {
      const purchase = (await payments.purchase({
        id: productId,
      })) as Purchase;

      await this.consumePurchaseCore(payments, purchase, consumePurchase);
    } catch (err) {
      console.error("Purchase error:", err);
      throw err;
    }
  }
}
