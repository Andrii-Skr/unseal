import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessagesForLocale } from "@/i18n/messages";

export const metadata: Metadata = {
  title: "For you",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#9a536d",
  viewportFit: "cover",
};

export default function CardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NextIntlClientProvider
      locale="en"
      messages={getMessagesForLocale("en")}
    >
      {children}
    </NextIntlClientProvider>
  );
}
