import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Для тебя",
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
  return children;
}
