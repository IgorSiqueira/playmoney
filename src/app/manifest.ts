import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SkillMoney — Aposte em Você Mesmo",
    short_name: "SkillMoney",
    description: "Plataforma de apostas na sua própria performance em jogos competitivos",
    start_url: "/",
    display: "standalone",
    background_color: "#030508",
    theme_color: "#00ff66",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
