import type { Metadata } from 'next';
import { LOCALES, LOCALE_POR_DEFECTO, SITE_URL, type Locale } from './config';

/** Hreflang de cada idioma (el chino se sirve en simplificado). */
export const HREFLANG: Record<Locale, string> = { es: 'es', ca: 'ca', ar: 'ar', fr: 'fr', en: 'en', ro: 'ro', zh: 'zh-Hans', uk: 'uk' };

/**
 * Canonical propio y hreflang de una ruta que existe en todos los idiomas (o en los que se indiquen).
 * `ruta` va sin el prefijo de idioma: '' para la portada, '/temas/2', etc.
 */
export function alternas(locale: Locale, ruta: string, idiomas: readonly Locale[] = LOCALES): NonNullable<Metadata['alternates']> {
  const languages: Record<string, string> = {};
  for (const l of idiomas) languages[HREFLANG[l]] = `/${l}${ruta}`;
  const xdef = idiomas.includes(LOCALE_POR_DEFECTO) ? LOCALE_POR_DEFECTO : idiomas[0];
  languages['x-default'] = `/${xdef}${ruta}`;
  return { canonical: `/${locale}${ruta}`, languages };
}

/** Variante para rutas con slug distinto en cada idioma (guías traducidas). */
export function alternasMapa(locale: Locale, rutas: Partial<Record<Locale, string>>): NonNullable<Metadata['alternates']> {
  const languages: Record<string, string> = {};
  for (const [l, r] of Object.entries(rutas) as [Locale, string][]) languages[HREFLANG[l]] = `/${l}${r}`;
  const xdef = rutas[LOCALE_POR_DEFECTO] ? LOCALE_POR_DEFECTO : (Object.keys(rutas)[0] as Locale);
  languages['x-default'] = `/${xdef}${rutas[xdef]}`;
  return { canonical: `/${locale}${rutas[locale] ?? ''}`, languages };
}

/** Guías que son la misma página en varios idiomas (para hreflang y sitemap). */
export const GUIAS_EQUIVALENTES: Partial<Record<Locale, string>>[] = [
  {
    es: 'test-ccse-gratis', ar: 'ikhtibar-ccse-majani', en: 'free-ccse-practice-test', fr: 'test-ccse-gratuit',
    ro: 'test-ccse-gratuit', uk: 'bezkoshtovnyi-test-ccse', zh: 'ccse-mianfei-ceshi',
  },
];
export function equivalentesGuia(locale: Locale, slug: string): Partial<Record<Locale, string>> {
  const g = GUIAS_EQUIVALENTES.find((x) => x[locale] === slug);
  return g ? Object.fromEntries(Object.entries(g).map(([l, s]) => [l, `/guia/${s}`])) : { [locale]: `/guia/${slug}` };
}

export const absoluta = (ruta: string) => `${SITE_URL}${ruta}`;

/** Entidad de la web y del editor, común a todas las páginas (JSON-LD). */
export function ldSitio(locale: Locale, marca: string, descripcion: string) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: marca,
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
      parentOrganization: { '@type': 'Organization', name: 'Nuevo en España', url: 'https://tuspapeles.app' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#web`,
      name: marca,
      url: `${SITE_URL}/${locale}`,
      inLanguage: HREFLANG[locale],
      description: descripcion,
      publisher: { '@id': `${SITE_URL}/#org` },
    },
  ];
}
