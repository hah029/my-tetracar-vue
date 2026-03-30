import ru from "./ru/translation.json";
import en from "./en/translation.json";

import flag_frame from "@/assets/images/flags/flag_frame.svg";          // Рамка для флага страны (универсальная)
import flag_auto from "@/assets/images/flags/flag_auto.svg";            // Значок автоматического определения языка (auto)
import flag_ru from "@/assets/images/flags/flag_ru.svg";                // Русский

// import flag_en_brit from "@/assets/images/flags/flag_pt-BR.svg";   

import flag_en_brit from "@/assets/images/flags/flag_en_british.svg";   // Английский (Британский флаг)
// import flag_en_usa from "@/assets/images/flags/flag_en_usa.svg";        // Английский (флаг США)
// import flag_es from "@/assets/images/flags/flag_es.svg";                // Испанский
// import flag_zh from "@/assets/images/flags/flag_zh.svg";                // Китайский
// import flag_zh from "@/assets/images/flags/flag_pt-BR.svg";                // Португальский (Бразильский)

export const locales = {
  en: en,
  ru: ru,
};

export const langSrc: Record<string, string> = {
  frame: flag_frame,
  auto: flag_auto,
  ru: flag_ru,
  en: flag_en_brit,
//   en: flag_en_usa,
//   es: flag_es,
//   es: flag_zh,
//   es: flag_pt-BR,
};
