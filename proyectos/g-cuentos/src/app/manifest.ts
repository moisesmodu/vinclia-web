import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lunilla · Cuentos personalizados", short_name: "Lunilla", start_url: "/", display: "standalone",
    background_color: "#FFF8EC", theme_color: "#2B3A67", lang: "es",
    icons: [{ src: "/icono-192.png", sizes: "192x192", type: "image/png" }, { src: "/icono-512.png", sizes: "512x512", type: "image/png" }, { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
  };
}
