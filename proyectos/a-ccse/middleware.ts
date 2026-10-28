import { NextResponse, type NextRequest } from 'next/server';
import { LOCALES, LOCALE_POR_DEFECTO } from '@/lib/config';

function preferido(req: NextRequest) {
  const c = req.cookies.get('ccse_idioma')?.value;
  if (c && (LOCALES as readonly string[]).includes(c)) return c;
  const al = req.headers.get('accept-language') ?? '';
  for (const parte of al.split(',')) {
    const l = parte.split(';')[0].trim().slice(0, 2).toLowerCase();
    if ((LOCALES as readonly string[]).includes(l)) return l;
  }
  return LOCALE_POR_DEFECTO;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const primero = pathname.split('/')[1];
  if ((LOCALES as readonly string[]).includes(primero)) {
    const r = NextResponse.next();
    r.cookies.set('ccse_idioma', primero, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    return r;
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${preferido(req)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next|nuevo-en-espana|\\.well-known|sw\\.js|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|icons|favicon\\.ico|.*\\.(?:png|svg|jpg|ico|txt|xml|json|webmanifest)).*)'],
};
