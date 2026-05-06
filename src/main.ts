import { createApp } from "vue";
import { createPinia } from "pinia";
import i18next from "i18next";
import I18NextVue from "i18next-vue";

import App from "./App.vue";
import { locales } from "./locales";
import { resolveAutoLanguage } from "./helpers/i18n";
import { Platform, type IGamePlatform } from './sdk/Platform';

// что выбрал пользователь
const savedLang = localStorage.getItem("lang") || "auto";

// итоговый язык
let initialLang = savedLang === "auto" ? resolveAutoLanguage() : savedLang;


async function init() {
	const platform = Platform.getInstance();
    	
    if (platform !== null) {
	   	await platform.init();
	    	
	    if (savedLang === 'auto') {
			initialLang = platform.getLocale();
			if (initialLang !== 'ru' && initialLang !== 'en') initialLang = 'en';	// fallback на для неподдерживаемых языков
		};

		const playerIsAuthorized = await platform.isPlayerAuthorized();
    	const playerId = await platform.getPlayerId();
    	const playerName = await platform.getPlayerName();
		
		console.log('playerIsAuthorized = ' + playerIsAuthorized);
		console.log('playerId = ' + playerId);
		console.log('playerName = ' + playerName);

		// пишем в лидерборд очки
		if (playerIsAuthorized) {
			const score = await platform.getPlayerDataByKey("highScore");
            console.log('подтянули очки', score);
            // if (score) {
            // }
            await platform.setLeaderboardScore('debugLeaderboard1', score);
            console.log('перезаписали очки');

		} else {
			console.log('ты не авторизован, нельзя тебе в лидерборд');			
		};
		
		// запрос 10 записей топа лидерборда и 3 записей вокруг игрока 
		const leaderboard = await platform.getLeaderboardEntries('debugLeaderboard1', 10, true, 3);
		console.log('leaderboard = ' + (leaderboard === null ? 'null' : JSON.stringify(leaderboard)));    		

		// сохранение пользовательских данных (сюда можно только числовые)
		await platform.setPlayerStats({mileage: 1234, score: 6789});

    	let playerStats = await platform.getPlayerStats(['mileage', 'score']);
		console.log('playerStats (выбранные ключи) = ' + (playerStats === null ? 'null' : JSON.stringify(playerStats)));

    	playerStats = await platform.getPlayerStats(null);
		console.log('playerStats (все ключи) = ' + (playerStats === null ? 'null' : JSON.stringify(playerStats)));

    	const playerData = await platform.getPlayerData();
		console.log('playerData = ' + (playerData === null ? 'null' : JSON.stringify(playerData)));

		const shopCatalog = await platform.getShopCatalog();
		console.log('shopCatalog = ' + (shopCatalog === null ? 'null' : JSON.stringify(shopCatalog)));

		// дозавершаем зависшие покупки (обязательно делаем это при старте игры!)
		platform.consumePrevPurchases((purchase) => {
			console.log('дозавершаем покупку, purchase = ' + (purchase ? JSON.stringify(purchase) : 'null'));
			// дозавершаем покупку, purchase = {"productID":"bulletPack1","purchaseToken":"0a240251-a16e-4b5a-8d73-d8bbf318bf2b"}
			// здесь совершаем начисление товара purchase.productID игроку
		});
		
		// показываем платформе, что игра готова к геймплею
    	platform.gameReady();  // правильно это запускать после загрузки и инициализации ассетов, но в игре мало ассетов, поэтому разница непринципиальна 	
	};
	
	i18next.init({
		lng: initialLang, 
		interpolation: { escapeValue: false },
		resources: {
			ru: { translation: locales.ru },
			en: { translation: locales.en },
		},
	});

	const app = createApp(App);
	app.use(createPinia());
	app.use(I18NextVue, { i18next });
	app.mount("#app");
	
	const p = document.getElementsByClassName('team_logo_group');

	if (p !== null) {
		p[0].addEventListener('click', () => {
			console.log('debug buy, platform = ' + platform);

			platform!.buyShopItem('bulletPack1', (purchase) => {
				console.log('купили, purchase = ' + (purchase ? JSON.stringify(purchase) : 'null'));
				// купили, purchase = {"productID":"bulletPack1","purchaseToken":"b4032de6-8255-42f8-a2cd-a13bef97d6b4"}			
				// здесь совершаем начисление товара purchase.productID игроку
			});
		});
	};
};

init();