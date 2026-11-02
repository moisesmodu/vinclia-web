import type { MetadataRoute } from "next";
import { urlBase } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/cuenta", "/*/gracias", "/*/acceso", "/*/baja"] }], sitemap: `${urlBase()}/sitemap.xml` };
}
