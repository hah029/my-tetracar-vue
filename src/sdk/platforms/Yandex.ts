import type { SDK, Player, LeaderboardEntriesData } from "ysdk";
import type { IGamePlatform } from "../IGamePlatform";

// Яндекс Игры
export class YandexPlatform implements IGamePlatform {
  private sdk: SDK | null = null;

  async init(): Promise<void> {
    // Здесь используется глобальный объект YaGames, который предоставляет SDK
    this.sdk = await YaGames.init();
  }

  async showFullscreenAd(
    callbackObject: any,
    openCallbackMethod: Function,
    closeCallbackMethod: Function,
  ): Promise<void> {
    if (!this.sdk) throw new Error("SDK not initialized");

    this.sdk.adv.showFullscreenAdv({
      callbacks: {
        onOpen: () => {
          console.log("Fullscreen Ad opened");
          if (openCallbackMethod !== null) {
            openCallbackMethod(callbackObject);
          }
        },
        onClose: () => {
          console.log("Fullscreen Ad closed");
          if (closeCallbackMethod !== null) {
            closeCallbackMethod(callbackObject);
          }
        },

        onError: () => closeCallbackMethod(callbackObject),
        //            onOffline: () => closeCallback(object)  - недокументировано, так что лучше не подключать
      },
    });
  }

  async showRewardedVideoAd(
    callbackObject: any,
    openCallbackMethod: Function,
    rewardCallbackMethod: Function,
    closeCallbackMethod: Function,
  ): Promise<void> {
    if (!this.sdk) throw new Error("SDK not initialized");

    this.sdk.adv.showRewardedVideo({
      callbacks: {
        onOpen: () => {
          console.log("Rewarded Ad opened");
          if (openCallbackMethod !== null) {
            openCallbackMethod(callbackObject);
          }
        },
        onClose: () => console.log("Rewarded Ad closed"),
        onRewarded: () => rewardCallbackMethod(callbackObject),
        onError: () => {
          console.log('Rewarded Ad error');
          if (closeCallbackMethod !== null) {
            closeCallbackMethod(callbackObject);
          }},
      },
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
    const data = await statsPromise;
    return data;
  }

  async setPlayerStats(stats: any | null) {
    if (!this.sdk) {
      return null;
    }
    const player = await this.sdk.getPlayer();
    return await player.setStats(stats);
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

    const data = await dataPromise;

    return data;
  }

  async getPlayerDataByKey(key: string) {
    if (!this.sdk) {
        return null;
      }
    
      const player = await this.sdk.getPlayer();

      const dataPromise = player.getData();

    if (!dataPromise) {
      return null;
    }

    const data = await dataPromise;

    return key in data ? data[key] : null;
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

  async setPlayerDataByKey(key: string, value: any) {
    if (!this.sdk) {
        return null;
      }
    
      const player = await this.sdk.getPlayer();

      const dataPromiseReader = player.getData();

    if (!dataPromiseReader) {
      return null;
    }

    let data = await dataPromiseReader;
    data[key] = value;

    const dataPromiseWriter = player.setData(data);

    if (!dataPromiseWriter) {
        return null;
    }
      const result = await dataPromiseWriter;
      return result;
  }

//   async setPlayerDataByKey(key: string, value: any) {
//     const player = this.getPlayer();
//     player.data[key] = value;
//     this.savePlayer(player);
//   }

  async getLeaderboardEntries(
    leaderboardName: string,
    quantityTop: number,
    includeUser: boolean,
    quantityAround: number,
  ): Promise<LeaderboardEntriesData> {
    if (!this.sdk) return null!;

    // получение топ-игроков и записей возле пользователя
    const entries = await this.sdk.leaderboards.getEntries(leaderboardName, {
      quantityTop: quantityTop,
      includeUser: includeUser,
      quantityAround: quantityAround,
    });

    return entries;
  }

  async setLeaderboardScore(
    leaderboardName: string,
    score: number,
  ): Promise<void> {
    if (!this.sdk) return;

    return await this.sdk.leaderboards.setScore(leaderboardName, score);
  }

  getLocale() {
    if (!this.sdk) return;
    return this.sdk.environment.i18n.lang;
  }

  gameReady() {
    if (!this.sdk) return;
    this.sdk.features.LoadingAPI.ready();
  }
  
  async consumePrevPurchases(consumePurchaseCallback: Function) {
    if (!this.sdk) return;
    
    const payments = await this.sdk.getPayments();
    
    console.log('consumePrevPurchases, payments = ' + (payments === null ? 'null': JSON.stringify(payments)));
    
				this.sdk.payments.getPurchases().then(purchases => {
	
if (purchases.length > 0) {							
console.log('purchases(to consume): ' + JSON.stringify(purchases));

// purchases(to consume): [{"productID":"bulletPack1","purchaseToken":"0a240251-a16e-4b5a-8d73-d8bbf318bf2b"}]

}
							
					purchases.forEach(purchase => this.consumePurchaseCore(payments, purchase, consumePurchaseCallback));  // дозавершаем каждую покупку
							
				});
    
    
    
    
	
	
  }


consumePurchaseCore(payments: any, purchase: any, callback: Function) {

console.log('consumePurchase, purchase = ' + (purchase !== null ? JSON.stringify(purchase) : 'null') );
console.log('consumePurchase, callback = ' + callback);

	if (callback !== null) {
		callback(purchase);  // отправляем в ядро игры для начислений игровых предметов и т.п.
	}

	
	/*
	// в purchase.productID отделяем группу от количества
    const lastUnderscoreIndex = purchase.productID.lastIndexOf('_');
                    
    if (lastUnderscoreIndex > 0) {
		const baseType = purchase.productID.substring(0, lastUnderscoreIndex);
        const quantityStr = purchase.productID.substring(lastUnderscoreIndex + 1);
        const quantity = parseInt(quantityStr, 10);
                        
        if (!isNaN(quantity)) {
			
    		if (baseType === 'fire_extinguisher') {
        		window.ysdkPlayer.incrementStats({ fire_extinguisher: quantity }).then(() => {
					
					// и сразу обновляем в игре
					if (window.game && window.game.player) {
						
						window.game.player.inventory.fireExtinguishersPurchased += quantity;
						
						window.game.player.updateFireExtinguisherStatus();
						
						window.game.threeGame.threeFireExtinguisherInHands.take();  // свежекупленный огнетушитель сразу отображаем в руках
						
					}
					
        		});
    		}
    		
        }
    }

	*/
	
	payments.consumePurchase(purchase.purchaseToken);  // это убирает незавершённость покупки на сервере ЯИ!
	
console.log('consumePurchase completed, purchase = ' + JSON.stringify(purchase));


}

  
  async getShopCatalog() {
    if (!this.sdk) return null;
    
    const payments = await this.sdk.getPayments();
    
    console.log('getShopCatalog, payments = ' + (payments === null ? 'null': JSON.stringify(payments)));

	const catalog = await payments.getCatalog(); 

    console.log('getShopCatalog, catalog = ' + (catalog === null ? 'null': JSON.stringify(catalog)));
    
//getShopCatalog, catalog = [{"id":"bulletPack1","title":"Патроны - 10 штук","description":"","imageURI":"/default256x256","price":"10 RUB","priceValue":"10","priceCurrencyCode":"RUB"},{"id":"removeAd","title":"Отключение рекламы","description":"","imageURI":"/default256x256","price":"20 RUB","priceValue":"20","priceCurrencyCode":"RUB"}]    
    
	return catalog;
  }
  
  async buyShopItem(productId: string, consumePurchase: Function) {
    if (!this.sdk) return null;
	
    console.log('Attempting to buy:', productId);

    const payments = await this.sdk.getPayments();
    
    if (payments) {
        payments.purchase(productId).then(purchase => {
			
            console.log('Purchase successful:', purchase);
            
//alert('Покупка успешна!, purchase = ' + JSON.stringify(purchase));
            
            // Дозавершаем покупку
            this.consumePurchaseCore(payments, purchase, consumePurchase);
            
        }).catch(err => {
            console.error('Purchase error:', err);
            
//alert('Ошибка покупки: ' + err.message);
            
        });
    } else {
        console.warn('Payments not available');
        
//alert('Покупки недоступны');

    }
    
	
	
  }

}
