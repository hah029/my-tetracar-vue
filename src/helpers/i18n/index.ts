// 🔍 поддерживаемые языки
const supportedLanguages = ["ru", "en"];
export const uiLanguages = ["auto", "ru", "en"];

// 🔍 определяем язык браузера
export function detectBrowserLanguage(): string {
  const lang = navigator.language || navigator.languages?.[0] || "en";
  return lang.split("-")[0]!;
}

// 🧠 резолв auto
export function resolveAutoLanguage(): string {
  const detected = detectBrowserLanguage();
  return supportedLanguages.includes(detected) ? detected : "en";
}
