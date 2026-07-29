import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unseal — a romantic card",
    short_name: "Unseal",
    description:
      "A personal romantic story with five locks and a message hidden inside a heart.",
    start_url: "/en/create",
    lang: "en",
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
