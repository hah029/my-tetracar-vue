import { createApp } from "vue";
import { createPinia } from "pinia";
import i18next from "i18next";
import I18NextVue from "i18next-vue";

import App from "./App.vue";
import { locales } from "./locales";
import { resolveAutoLanguage } from "./helpers/i18n";
import { PlatformFactory } from './sdk/PlatformFactory';
import type { IGamePlatform } from './sdk/PlatformFactory';

// 💾 что выбрал пользователь
const savedLang = localStorage.getItem("lang") || "auto";

// 🎯 итоговый язык
let initialLang = savedLang === "auto" ? resolveAutoLanguage() : savedLang;


let platform: IGamePlatform | null = null;

async function init() {

	platform = PlatformFactory.getPlatform();

	//let lang = 'en';
    	
    if (platform !== null) {
		
	   	await platform.init();
	    	
	    if (savedLang === 'auto') {
				
			initialLang = platform.getLocale();
			
			// fallback на для неподдерживаемых языков:
			if (initialLang !== 'ru' && initialLang !== 'en') {
				initialLang = 'en';
			}
			
			
			
		}
			
		const playerIsAuthorized = await platform.isPlayerAuthorized();

console.log('playerIsAuthorized = ' + playerIsAuthorized);    		
			
    	const playerId = await platform.getPlayerId();
    	const playerName = await platform.getPlayerName();
    		
console.log('playerId = ' + playerId);    		
console.log('playerName = ' + playerName);    		

		// пишем в лидерборд очки
		if (playerIsAuthorized) {
			
			const score = Math.floor(Math.random() * 10000000);
			
			await platform.setLeaderboardScore('debugLeaderboard1', score);
console.log('перезаписали очки');
			
		} else {
console.log('ты не авторизован, нельзя тебе в лидерборд');			
		}
		
		
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

		
		
		// показываем платформе, что игра готова к геймплею
    	platform.gameReady();  // правильно это запускать после загрузки и инициализации ассетов, но в игре мало ассетов, поэтому разница непринципиальна 	
    		
	}

	
	
	i18next.init({
	  lng: initialLang,
  		interpolation: {
    	escapeValue: false,
  	},
  resources: {
    ru: { translation: locales.ru },
    en: { translation: locales.en },
  },
});

	const app = createApp(App);
	app.use(createPinia());
	app.use(I18NextVue, { i18next });
	app.mount("#app");
	
	
	
	
	
	
}

init();
