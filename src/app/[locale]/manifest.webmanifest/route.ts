import { getMessagesForLocale } from "@/i18n/messages";
import {
  isAppLocale,
  routing,
  type AppLocale,
} from "@/i18n/routing";

type ManifestRouteContext = {
  params: Promise<{ locale: string }>;
};

function buildManifest(locale: AppLocale) {
  const messages = getMessagesForLocale(locale).Manifest;
  return {
    name: messages.name,
    short_name: "Unseal",
    description: messages.description,
    start_url: `/${locale}/create`,
    lang: locale,
    display: "standalone",
    background_color: "#f7efe2",
    theme_color: "#a85571",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

export async function GET(
  _request: Request,
  { params }: ManifestRouteContext,
) {
  const { locale: requestedLocale } = await params;
  const locale = isAppLocale(requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  return Response.json(buildManifest(locale), {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "application/manifest+json",
    },
  });
}
