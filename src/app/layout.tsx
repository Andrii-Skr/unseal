import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Unseal — чувства, которые открывают не спеша",
    template: "%s — Unseal",
  },
  description:
    "Создайте личную романтическую историю с пятью замками и посланием внутри сердца.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Unseal",
  },
  other: {
    "msapplication-TileColor": "#f7efe2",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7efe2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
