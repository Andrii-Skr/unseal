import type { ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { getMessagesForLocale } from "@/i18n/messages";
import type { AppLocale } from "@/i18n/routing";

export function renderWithIntl(
  ui: ReactNode,
  locale: AppLocale = "ru",
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={getMessagesForLocale(locale)}
    >
      {ui}
    </NextIntlClientProvider>,
    options,
  );
}
