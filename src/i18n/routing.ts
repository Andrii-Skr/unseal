import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "en", "uk"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(value: unknown): value is AppLocale {
  return (
    typeof value === "string" &&
    routing.locales.includes(value as AppLocale)
  );
}
