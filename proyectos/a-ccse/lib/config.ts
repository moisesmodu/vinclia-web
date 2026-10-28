import es from '@/config/paises/es.json';

export const PAIS = es;
export type Pais = typeof es;

export const LOCALES = ['es', 'ca', 'ar', 'fr', 'en', 'ro', 'zh', 'uk'] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_POR_DEFECTO: Locale = 'es';
/** Lenguas con explicación propia; el catalán usa la explicación en castellano. */
export const LENGUAS_EXPLICACION = ['es', 'ar', 'fr', 'en', 'ro', 'zh', 'uk'] as const;
export type LenguaExplicacion = (typeof LENGUAS_EXPLICACION)[number];

export const NOMBRE_LOCALE: Record<Locale, string> = {
  es: 'Español', ca: 'Català', ar: 'العربية', fr: 'Français', en: 'English', ro: 'Română', zh: '中文', uk: 'Українська',
};
export const RTL: Locale[] = ['ar'];

export function esLocale(x: string | undefined | null): x is Locale {
  return !!x && (LOCALES as readonly string[]).includes(x);
}
export function lenguaExplicacion(l: Locale): LenguaExplicacion {
  return l === 'ca' ? 'es' : l;
}
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export function precioTexto(locale: Locale = 'es') {
  return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale, { style: 'currency', currency: PAIS.moneda }).format(
    PAIS.precioCentimos / 100,
  );
}
