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

function conRef(req: NextRequest, r: NextResponse) {
  const ref = req.nextUrl.searchParams.get('ref');
  if (ref && /^[\w-]{2,40}$/.test(ref)) r.cookies.set('ccse_ref', ref, { path: '/', maxAge: 60 * 86400, sameSite: 'lax' });
  return r;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const primero = pathname.split('/')[1];
  if ((LOCALES as readonly string[]).includes(primero)) {
    const r = NextResponse.next();
    r.cookies.set('ccse_idioma', primero, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    return conRef(req, r);
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${preferido(req)}${pathname === '/' ? '' : pathname}`;
  return conRef(req, NextResponse.redirect(url));
}

export const config = {
  matcher: ['/((?!api|_next|nuevo-en-espana|\\.well-known|sw\\.js|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|icons|img|marca|og|favicon\\.ico|.*\\.(?:png|svg|jpg|webp|avif|ico|txt|xml|json|webmanifest)).*)'],
};
