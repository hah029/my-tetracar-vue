import ru from "./ru/translation.json";
import en from "./en/translation.json";

import flag_auto from "@/assets/images/flag_auto.svg";
import flag_ru from "@/assets/images/flag_ru.svg";
import flag_en from "@/assets/images/flag_en.svg";
import flag_es from "@/assets/images/flag_es.svg";

export const locales = {
  en: en,
  ru: ru,
};

export const langSrc: Record<string, string> = {
  auto: flag_auto,
  ru: flag_ru,
  en: flag_en,
  es: flag_es,
};
