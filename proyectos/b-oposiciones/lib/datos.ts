import 'server-only';
import { bancos } from '@/generado';
import type { Banco, BancoPublico, Oposicion, Pregunta, Tema } from './tipos';
import pais from '@/config/paises/es.json';
import marca from '@/config/marca.json';

export { pais, marca };

export function oposiciones(): Oposicion[] {
  return Object.values(bancos)
    .map((b) => b.oposicion)
    .filter((o) => o.activa);
}

export function banco(slug: string): Banco | undefined {
  const b = (bancos as Record<string, Banco>)[slug];
  return b && b.oposicion.activa ? b : undefined;
}

export function tema(slug: string, temaSlug: string): { b: Banco; t: Tema } | undefined {
  const b = banco(slug);
  const t = b?.oposicion.temas.find((x) => x.slug === temaSlug);
  return b && t ? { b, t } : undefined;
}

export function bancoPublico(slug: string): BancoPublico | undefined {
  const b = banco(slug);
  if (!b) return undefined;
  const gratis = b.preguntas.filter((p) => p.gratis);
  const ejemplos: BancoPublico['ejemplos'] = {};
  for (const t of b.oposicion.temas) {
    const p = gratis.find((q) => q.tema === t.n) ?? b.preguntas.find((q) => q.tema === t.n);
    ejemplos[t.n] = p ? { id: p.id, ca: { ...p.ca, explicacion: '' }, es: { ...p.es, explicacion: '' } } : undefined;
  }
  const { preguntas: _omit, ...resto } = b;
  return { ...resto, gratis, ejemplos };
}

export function preguntasAccesibles(slug: string, suscrito: boolean): Pregunta[] {
  const b = banco(slug);
  if (!b) return [];
  return suscrito ? b.preguntas : b.preguntas.filter((p) => p.gratis);
}

export function totalPreguntas(): number {
  return Object.values(bancos).reduce((s, b) => s + (b.oposicion.activa ? b.preguntas.length : 0), 0);
}

export function precioTexto(centimos: number, idioma: 'ca' | 'es'): string {
  return new Intl.NumberFormat(pais.locale[idioma], { style: 'currency', currency: pais.moneda }).format(centimos / 100);
}

export const urlBase = () => (process.env.NEXT_PUBLIC_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : `https://${marca.dominio}`)).replace(/\/$/, '');
