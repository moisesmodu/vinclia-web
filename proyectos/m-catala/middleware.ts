import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const al = req.headers.get('accept-language') ?? '';
  // Català per defecte (MARCAS.md: Aprova parla en català); castellà només si el navegador el prefereix clarament i no té català.
  const idioma = /\bca\b/i.test(al) ? 'ca' : /^\s*es\b/i.test(al) ? 'es' : 'ca';
  return NextResponse.redirect(new URL(`/${idioma}`, req.url));
}

export const config = { matcher: ['/'] };
