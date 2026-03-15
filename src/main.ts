import { createApp } from "vue";
import { createPinia } from "pinia";
import i18next from "i18next";
import I18NextVue from "i18next-vue";

import App from "./App.vue";
import { locales } from "./helpers/locales";

i18next.init({
  lng: "en",
  interpolation: {
    escapeValue: false,
  },
  // fallbackLng: false,
  resources: {
    ru: { translation: locales.ru },
    en: { translation: locales.en },
  },
});

const app = createApp(App);
app.use(createPinia());
app.use(I18NextVue, { i18next });
app.mount("#app");
