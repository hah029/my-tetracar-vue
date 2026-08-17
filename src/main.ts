import { createApp } from "vue";
import { createPinia } from "pinia";
import i18next from "i18next";
import I18NextVue from "i18next-vue";
import * as THREE from "three";

import App from "./App.vue";
import { locales } from "./locales";
import { resolveAutoLanguage } from "./helpers/i18n";
import { Platform } from "./sdk";
import { loadAtlas } from "./assets/textures/TextureAtlas";
import { useProgressStore } from "./store/progressStore";
import { useDailyGiftStore } from "./store/dailyGiftStore";
import { useObjectivesStore } from "./store/objectivesStore";
import { useAudioStore } from "./store/audioStore";
import { useGameState } from "./store/gameState";
import {
  AnalyticsReporter,
  AdCoordinator,
  ConsoleAnalyticsAdapter,
  DevFileAnalyticsAdapter,
  installTelemetryDebugLogger,
  installObjectivesSubscriber,
  SessionStatsCollector,
  Telemetry,
  type TelemetryPlatform,
} from "./telemetry";

const savedLang = localStorage.getItem("lang") || "auto";
let initialLang = savedLang === "auto" ? resolveAutoLanguage() : savedLang;

let threeScene: THREE.Scene | null = null;
let threeRenderer: THREE.WebGLRenderer | null = null;

export function registerThreeDebug(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
) {
  threeScene = scene;
  threeRenderer = renderer;
  (window as any).__THREE_DEBUG__ = {
    scene: threeScene,
    renderer: threeRenderer,
  };
  console.log("✅ ThreeJS debug panel registered");
}

async function init() {
  const platform = Platform.getInstance();
  const telemetryPlatform: TelemetryPlatform =
    typeof YaGames !== "undefined" ? "yandex" : "local";

  if (platform !== null) {
    await platform.init();

    if (savedLang === "auto") {
      initialLang = platform.getLocale();
      if (initialLang !== "ru" && initialLang !== "en") initialLang = "en";
    }

    const playerId = await platform.getPlayerId().catch(() => null);
    Telemetry.initialize({
      platform: telemetryPlatform,
      locale: initialLang,
      identity:
        typeof playerId === "string" && playerId.length > 0
          ? { kind: "platform", id: playerId }
          : undefined,
    });
    platform.consumePrevPurchases((purchase) => {
      console.log(
        "дозавершаем покупку, purchase = " +
          (purchase ? JSON.stringify(purchase) : "null"),
      );
    });

    platform.gameReady();
  }

  i18next.init({
    lng: initialLang,
    interpolation: { escapeValue: false },
    resources: {
      ru: { translation: locales.ru },
      en: { translation: locales.en },
    },
  });

  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(I18NextVue, { i18next });

  const analyticsReporter = new AnalyticsReporter(
    import.meta.env.DEV
      ? [new ConsoleAnalyticsAdapter(), new DevFileAnalyticsAdapter()]
      : [new ConsoleAnalyticsAdapter()],
  );
  installTelemetryDebugLogger();
  installObjectivesSubscriber();
  const sessionStatsCollector = new SessionStatsCollector();
  analyticsReporter.attachSessionStats(sessionStatsCollector);
  AdCoordinator.getInstance();
  Telemetry.emit({ type: "app.opened", launchType: "cold" });

  const gameState = useGameState(pinia);
  let isPageHidden = false;
  const suspendForPageHidden = () => {
    if (isPageHidden) return;
    isPageHidden = true;
    Telemetry.emit({ type: "app.backgrounded", visibilityState: "hidden" });
    if (gameState.currentState === "play") gameState.pauseForPageHidden();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      suspendForPageHidden();
    } else {
      isPageHidden = false;
      Telemetry.emit({ type: "app.foregrounded", visibilityState: document.visibilityState });
    }
  });
  window.addEventListener("pagehide", suspendForPageHidden);

  await useAudioStore(pinia).ready;
  await useProgressStore(pinia).restoreProgress();
  await useDailyGiftStore(pinia).restore();
  await useObjectivesStore(pinia).restore();
  Telemetry.recoverAbandonedRun();
  Telemetry.emit({ type: "app.ready" });

  app.mount("#app");

//   const p = document.getElementsByClassName("team_logo_group");

//   if (p !== null) {
//     p[0].addEventListener("click", () => {
//       console.log("debug buy, platform = " + platform);

//       platform!.buyShopItem("bulletPack1", (purchase) => {
//         console.log(
//           "купили, purchase = " +
//             (purchase ? JSON.stringify(purchase) : "null"),
//         );
//         // купили, purchase = {"productID":"bulletPack1","purchaseToken":"b4032de6-8255-42f8-a2cd-a13bef97d6b4"}
//         // здесь совершаем начисление товара purchase.productID игроку
//       });
//     });
//   }
}

loadAtlas()
  .then(() => init())
  .catch((err) => console.log("Atlas loading failed:", err));
