import { createApp } from "vue";
import { createPinia } from "pinia";
import i18next from "i18next";
import I18NextVue from "i18next-vue";

import App from "./App.vue";
import { locales } from "./locales";
import { resolveAutoLanguage } from "./helpers/i18n";

// 💾 что выбрал пользователь
const savedLang = localStorage.getItem("lang") || "auto";

// 🎯 итоговый язык
const initialLang = savedLang === "auto" ? resolveAutoLanguage() : savedLang;

// 🚀 init i18next
i18next.init({
  lng: initialLang,
  fallbackLng: "en",
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
