import type { SDK, Player, LeaderboardEntriesData } from 'ysdk';

// Общий интерфейс для всех платформ
export interface IGamePlatform {
    init(): Promise<void>;
    showFullscreenAd(object: any, openCallbackMethod: Function, closeCallback: Function): Promise<void>;
    showRewardedVideoAd(object: any, openCallbackMethod: Function, rewardCallback: Function, closeCallback: Function): Promise<void>;
    isPlayerAuthorized(): any | null;
    getPlayerId(): any | null;
    getPlayerName(): any | null;
    getPlayerData(): any | null;
    setPlayerData(data: any): any | null;
    getPlayerStats(keys: Array<string> | null): any | null;
    setPlayerStats(stats: any | null): any | null;
    setLeaderboardScore(leaderboardName: string, score: number): Promise<void>;
    getLocale();  // запрос языка
    gameReady();// дёргаем, когда всё загрузилось и игра полностью готова к геймплею
    getLeaderboardEntries(leaderboardName: string, quantityTop: number, includeUser: boolean, quantityAround: number): any | null;
}

// Яндекс Игры
class YandexPlatform implements IGamePlatform {
    private sdk: SDK | null = null;

    async init(): Promise<void> {
        // Здесь используется глобальный объект YaGames, который предоставляет SDK
        this.sdk = await YaGames.init();
    }

    async showFullscreenAd(callbackObject: any, openCallbackMethod: Function, closeCallbackMethod: Function): Promise<void> {
        if (!this.sdk) throw new Error('SDK not initialized');
        
        this.sdk.adv.showFullscreenAdv({ 
            callbacks: { 
				onOpen: () => {
								console.log('Fullscreen Ad opened')
								if (openCallbackMethod !== null) {
									openCallbackMethod(callbackObject);
								} 
					}, 
				onClose: () => {
							console.log('Fullscreen Ad closed');
							if (closeCallbackMethod !== null) {
								closeCallbackMethod(callbackObject);
							} 
						}, 
					 
            onError: () => closeCallbackMethod(callbackObject), 
//            onOffline: () => closeCallback(object)  - недокументировано, так что лучше не подключать 
            } 
        });
        
    }
    

    async showRewardedVideoAd(callbackObject: any, openCallbackMethod: Function, rewardCallbackMethod: Function, closeCallbackMethod: Function): Promise<void> {
        if (!this.sdk) throw new Error('SDK not initialized');
        
        this.sdk.adv.showRewardedVideo({ 
            callbacks: { 
				onOpen: () => {
								console.log('Rewarded Ad opened');
								if (openCallbackMethod !== null) {
									openCallbackMethod(callbackObject);
								} 
					}, 
				onClose: () => {
							console.log('Rewarded Ad closed');
							if (closeCallbackMethod !== null) {
								closeCallbackMethod(callbackObject);
							}}, 
            	onRewarded: () => rewardCallbackMethod(callbackObject), 
				onError: () => {
							console.log('Rewarded Ad error');
							if (closeCallbackMethod !== null) {
								closeCallbackMethod(callbackObject);
							}} 
            } 
        });
    }
    

    async isPlayerAuthorized() {
        
        if (!this.sdk) return null;
        
        const player = await this.sdk.getPlayer();
         
        return player === undefined ? null : player.isAuthorized();
    }

    async getPlayerId() {
        
        if (!this.sdk) return null;
        
        const player = await this.sdk.getPlayer();
         
        return player === undefined ? null : player.getUniqueID();
    }


    async getPlayerName() {
        
        if (!this.sdk) return null;
        
        const player = await this.sdk.getPlayer();
         
        return player === undefined ? null : player.getName();
    }

    async getPlayerStats(keys: Array<string> | null) {
        if (!this.sdk) {
			return null;
        }
        const player = await this.sdk.getPlayer();
        let statsPromise;
        if (keys === null) {
         	statsPromise = player.getStats();
		} else {
         	statsPromise = player.getStats(keys);
		}
        if (!statsPromise) {
			return null;
		} 
		const data = (await statsPromise); 
        return data;
    }

    async setPlayerStats(stats: any | null) {
        if (!this.sdk) {
			return null;
        }
        const player = await this.sdk.getPlayer();
        return (await player.setStats(stats));
    }

    async getPlayerData() {
		
        if (!this.sdk) {
			return null;
        }
        
        const player = await this.sdk.getPlayer();
        
        const dataPromise = player.getData();
        
        if (!dataPromise) {
			return null;
		} 

		const data = (await dataPromise); 
        
        return data;
    }
    
    async setPlayerData(data: any) {
        if (!this.sdk) {
			return null;
        }
        
        const player = await this.sdk.getPlayer();
        
        const dataPromise = player.setData(data);
        
        if (!dataPromise) {
			return null;
		} 

		const result = await dataPromise; 
        
        return result;
		
	}

    async getLeaderboardEntries(leaderboardName: string, quantityTop: number, includeUser: boolean, quantityAround: number): Promise<LeaderboardEntriesData> {
        if (!this.sdk) return null!;
        
		// получение топ-игроков и записей возле пользователя
		const entries = await this.sdk.leaderboards.getEntries(leaderboardName, {
    		quantityTop: quantityTop,
    		includeUser: includeUser,
    		quantityAround: quantityAround
		});

		return entries;
    }

    async setLeaderboardScore(leaderboardName: string, score: number): Promise<void> {
        if (!this.sdk) return;
        
		return await this.sdk.leaderboards.setScore(leaderboardName, score);
    }
    
    getLocale() {
        if (!this.sdk) return;
		return this.sdk.environment.i18n.lang;
	}
    
    gameReady() {
        if (!this.sdk) return;
		this.sdk.features.LoadingAPI.ready()
	}
    
    
}

// 3. Фабрика для создания нужной платформы
export class PlatformFactory {
    static getPlatform(): IGamePlatform | null {
        // Определяем платформу по наличию глобальных объектов
        if (typeof YaGames !== 'undefined') {
            return new YandexPlatform();
        }
        
        // Здесь будут условия для VK, CrazyGames и других
        // if (typeof VK !== 'undefined') return new VKPlatform();
        
        ///throw new Error('Platform not supported');
        
console.log('Platform not supported!')        
        
        return null;
    }
}

