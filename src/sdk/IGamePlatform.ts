import type { Product } from "ysdk";

export type PlatformAdCallbacks = {
  onOpen?: () => void;
  onClose?: () => void;
  onRewarded?: () => void;
  onError?: (error: unknown) => void;
};

export interface IGamePlatform {
  init(): Promise<void>;

  // #region - работа с рекламой
  showFullscreenAd(callbacks: PlatformAdCallbacks): void;

  showRewardedVideoAd(callbacks: PlatformAdCallbacks): void;

  showStickyBannerAd(): void;

  hideStickyBannerAd(): void;

  getStickyBannerAdStatus(): "shown" | "hidden" | "unknown";
  // #endregion

  // #region - работа с Player
  isPlayerAuthorized(): any | null;

  getPlayerId(): any | null;

  getPlayerName(): any | null;

  getPlayerData(): any | null;

  setPlayerData(data: any): any | null;

  getPlayerDataByKey(key: string): any | null;

  setPlayerDataByKey(key: string, value: any): any | null;

  getPlayerStats(keys?: string[]): Promise<Partial<Stats> | null>;

  getPlayerStatByKey(key: string): any | null;

  setPlayerStats(stats: any | null): any | null;

  setPlayerStatByKey(key: string, value: any): any | null;

  getLocale(); // запрос языка
  // #endregion

  // #region - работа с лидербордами
  setLeaderboardScore(leaderboardName: string, score: number): Promise<void>;

  getLeaderboardEntries(
    leaderboardName: string,
    quantityTop: number,
    includeUser: boolean,
    quantityAround: number,
  ): any | null;
  // #endregion

  // #region - shop
  consumePrevPurchases(consumePurchaseCallback: Function): Promise<any>;

  getShopCatalog(): Promise<Product[] | null>;

  buyShopItem(productId: string, consumePurchase: Function): Promise<any>;
  // #endregion

  gameReady(); // дёргаем, когда всё загрузилось и игра полностью готова к геймплею
  gameStart();
  gameStop();
}

// export type UserData = {
//     highScore?: number,
//     goldens?: number,
//     energons?: number,
// }
