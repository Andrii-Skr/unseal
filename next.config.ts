import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default function defineNextConfig(phase: string): NextConfig {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;

  return withNextIntl({
    allowedDevOrigins: isDevelopment ? ["*.trycloudflare.com"] : undefined,
    devIndicators: isDevelopment ? false : undefined,
    distDir: process.env.NEXT_DIST_DIR ?? ".next",
    experimental: isDevelopment
      ? {
          serverActions: {
            allowedOrigins: ["*.trycloudflare.com"],
          },
        }
      : undefined,
    typescript: {
      tsconfigPath:
        process.env.NEXT_DIST_DIR === ".next-e2e"
          ? "tsconfig.e2e.json"
          : "tsconfig.json",
    },
    images: {
      qualities: [75, 88],
    },
    async headers() {
      return [
        {
          source: "/card/:path*",
          headers: [
            {
              key: "X-Robots-Tag",
              value: "noindex, nofollow, noarchive",
            },
          ],
        },
      ];
    },
  });
}
