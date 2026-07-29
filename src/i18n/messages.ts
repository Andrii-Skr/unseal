import en from "../../messages/en.json";
import ru from "../../messages/ru.json";
import uk from "../../messages/uk.json";
import type { AppLocale } from "@/i18n/routing";

export const messagesByLocale = { ru, en, uk } as const;

export function getMessagesForLocale(locale: AppLocale) {
  return messagesByLocale[locale];
}
