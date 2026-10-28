import { NextResponse, type NextRequest } from "next/server";
import cfg from "@/config/paises/es.json";

const IDIOMAS = cfg.idiomas;

// "/" y rutas sin idioma → /<idioma> según el navegador. El resto pasa sin tocar.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const primero = pathname.split("/")[1];
  if (IDIOMAS.includes(primero)) return NextResponse.next();
  const acepta = (req.headers.get("accept-language") ?? "").toLowerCase();
  const pedido = acepta
    .split(",")
    .map((p) => p.split(";")[0].trim().slice(0, 2))
    .find((c) => IDIOMAS.includes(c));
  const url = req.nextUrl.clone();
  url.pathname = `/${pedido ?? cfg.idiomaPorDefecto}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|favicon|icon|apple-icon|manifest|sw.js|robots.txt|sitemap.xml|iconos|\\.well-known|.*\\..*).*)"]
};
