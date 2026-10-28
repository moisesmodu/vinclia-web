import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const al = req.headers.get('accept-language') ?? '';
  const idioma = /^\s*ca\b/i.test(al) || /(^|,)\s*ca(-ES)?\b/i.test(al.split(',').slice(0, 2).join(',')) ? 'ca' : 'es';
  return NextResponse.redirect(new URL(`/${idioma}`, req.url));
}

export const config = { matcher: ['/'] };
