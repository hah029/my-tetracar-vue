import ru from "./ru/translation.json";
import en from "./en/translation.json";

import flag_frame from "@/assets/images/flags/flag_frame.svg";          // Рамка для флага страны (универсальная)
import flag_auto from "@/assets/images/flags/flag_auto.svg";            // Значок автоматического определения языка (auto)
import flag_ru from "@/assets/images/flags/flag_ru.svg";                // Россия

import flag_en_brit from "@/assets/images/flags/flag_en_brit.svg";   

// import flag_en_brit from "@/assets/images/flags/flag_en_brit.svg";      // Английский (Британский флаг)
// import flag_en_usa from "@/assets/images/flags/flag_en_usa.svg";        // Английский (флаг США)
// import flag_de from "@/assets/images/flags/flag_de.svg";                // Германия
// import flag_es from "@/assets/images/flags/flag_es.svg";                // Испания
// import flag_zh from "@/assets/images/flags/flag_zh.svg";                // Китай
// import flag_pt_BR from "@/assets/images/flags/flag_pt_BR.svg";          // Португалия (Бразильский)
// import flag_ja from "@/assets/images/flags/flag_ja.svg";                // Япония
// import flag_ko from "@/assets/images/flags/flag_ko.svg";                // Южная Корея
// import flag_tr from "@/assets/images/flags/flag_tr.svg";                // Турция
// import flag_fr from "@/assets/images/flags/flag_fr.svg";                // Франция

export const locales = {
  en: en,
  ru: ru,
};

export const langSrc: Record<string, string> = {
  frame: flag_frame,
  auto: flag_auto,
  ru: flag_ru,
  en: flag_en_brit,
  // en: flag_en_usa,
  // de: flag_de,
  // es: flag_es,
  // zh: flag_zh,
  // pt: flag_pt_BR,   // pg два (Европ и Бразил)
  // ja: flag_ja,
  // ko: flag_ko,
  // tr: flag_tr,
  // fr: flag_fr,
};
