// Общий интерфейс для всех платформ
export interface IGamePlatform {
  init(): Promise<void>;
  showFullscreenAd(
    object: any,
    openCallbackMethod: Function,
    closeCallback: Function,
  ): Promise<void>;
  showRewardedVideoAd(
    object: any,
    openCallbackMethod: Function,
    rewardCallback: Function,
  ): Promise<void>;
  isPlayerAuthorized(): any | null;
  getPlayerId(): any | null;
  getPlayerName(): any | null;
  getPlayerData(): any | null;
  setPlayerData(data: any): any | null;
  getPlayerDataByKey(key: string): any | null;
  setPlayerDataByKey(key: string, value: any): any | null;
  getPlayerStats(keys: Array<string> | null): any | null;
  setPlayerStats(stats: any | null): any | null;
  setLeaderboardScore(leaderboardName: string, score: number): Promise<void>;
  getLocale(); // запрос языка
  gameReady(); // дёргаем, когда всё загрузилось и игра полностью готова к геймплею
  getLeaderboardEntries(
    leaderboardName: string,
    quantityTop: number,
    includeUser: boolean,
    quantityAround: number,
  ): any | null;
  consumePrevPurchases(consumePurchase: Function); // дозавершаем подвисшие предыдущие покупки (начисляем игроку купленные игровые предметы)
  getShopCatalog(): any | null;  // получаем список товаров магазина
  buyShopItem(productId: string, consumePurchase: Function);  // запускаем процесс покупки
}
