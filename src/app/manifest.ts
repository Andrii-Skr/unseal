import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unseal — романтическая открытка",
    short_name: "Unseal",
    description:
      "Персональная романтическая история с пятью замками и посланием внутри сердца.",
    start_url: "/create",
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
