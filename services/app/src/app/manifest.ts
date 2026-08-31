import type { MetadataRoute } from "next";
import { FEATURES } from "@/lib/config/features";

export default function manifest(): MetadataRoute.Manifest | null {
  if (!FEATURES.pwa) {
    return null;
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Menlu 门路 Platform";
  const appShortName = process.env.NEXT_PUBLIC_APP_SHORT_NAME || "Menlu";

  return {
    name: appName,
    short_name: appShortName,
    description: "Plataforma SaaS de Gestión Inteligente & Gamificación para Dojos de Artes Marciales",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#f59e0b",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
