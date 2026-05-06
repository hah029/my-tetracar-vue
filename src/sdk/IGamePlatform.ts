// общий интерфейс для всех платформ
export interface IGamePlatform {
    init(): Promise<void>;
    
    // #region - работа с рекламой
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
    // #endregion

    // #region - работа с Player
    isPlayerAuthorized(): any | null;
    
    getPlayerId(): any | null;
    
    getPlayerName(): any | null;
    
    getPlayerData(): any | null;
    
    setPlayerData(data: any): any | null;
    
    getPlayerDataByKey(key: string): any | null;
    
    setPlayerDataByKey(key: string, value: any): any | null;
    
    getPlayerStats(keys: Array<string> | null): any | null;
    
    setPlayerStats(stats: any | null): any | null;

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
    
    // #region - работа с внутриигровыми покупками
    consumePrevPurchases(consumePurchase: Function); // дозавершаем подвисшие предыдущие покупки (начисляем игроку купленные игровые предметы)
    
    getShopCatalog(): any | null;  // получаем список товаров магазина
    
    buyShopItem(productId: string, consumePurchase: Function);  // запускаем процесс покупки
    // #endregion

    gameReady(); // дёргаем, когда всё загрузилось и игра полностью готова к геймплею
};


// export type UserData = {
//     highScore?: number,
//     goldens?: number,
//     energons?: number,
// }