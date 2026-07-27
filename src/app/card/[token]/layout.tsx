import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Для тебя",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

export default function CardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
