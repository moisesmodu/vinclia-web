import type { MetadataRoute } from "next";
import { URL_BASE } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/cuento/", "/ca/cuento/", "/pedido/", "/ca/pedido/", "/pago-simulado/", "/ca/pago-simulado/", "/afiliados/panel"] },
    sitemap: `${URL_BASE()}/sitemap.xml`,
  };
}
