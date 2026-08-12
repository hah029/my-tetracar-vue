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

  if (platform !== null) {
    await platform.init();

    if (savedLang === "auto") {
      initialLang = platform.getLocale();
      if (initialLang !== "ru" && initialLang !== "en") initialLang = "en";
    }

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
  app.use(createPinia());
  app.use(I18NextVue, { i18next });
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
