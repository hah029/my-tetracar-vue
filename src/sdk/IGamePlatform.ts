import type { Product } from "ysdk";

export interface IGamePlatform {
  init(): Promise<void>;

  // #region - работа с рекламой
  showFullscreenAd(
    object: any,
    openCallbackMethod: Function,
    closeCallback: Function,
  ): void;

  showRewardedVideoAd(
    object: any,
    openCallbackMethod: Function,
    rewardCallback: Function,
    closeCallback: Function,
  ): void;
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
}

// export type UserData = {
//     highScore?: number,
//     goldens?: number,
//     energons?: number,
// }
