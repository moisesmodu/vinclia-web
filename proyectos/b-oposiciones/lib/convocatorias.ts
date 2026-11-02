import type { Idioma, Texto } from './tipos';
import { fechaLarga } from '@/components/Convocatoria';
import datos from '@/contenido/convocatorias.json';

/** Campos de una convocatoria que se pueden comprobar uno a uno contra el diario oficial. */
export type CampoConv = 'referencia' | 'diario' | 'fechaPublicacion' | 'plazas' | 'plazoHasta' | 'fechaExamen' | 'grupo' | 'url' | 'estado';

export type Conv = {
  id: string;
  organismo: string;
  cuerpo: Texto;
  nombreCorto: Texto;
  grupo?: string | null;
  plazas?: number | null;
  estado: string;
  referencia?: string | null;
  diario?: string | null;
  fechaPublicacion?: string | null;
  plazoHasta?: string | null;
  fechaExamen?: string | null;
  url?: string | null;
  oposicion?: string | null;
  verificado?: string;
  nota?: Texto;
  agrupa?: boolean;
  /** Comprobación directa en el diario oficial o en la web del órgano convocante (fecha, campos confirmados, fuentes y datos leídos). */
  comprobado?: { fecha: string; campos: CampoConv[]; fuentes: { nombre: string; url: string }[]; datos?: Texto[]; requisitos?: Texto[] };
};

export const actualizado: string = datos.actualizado;
export const convocatorias = (): Conv[] => datos.convocatorias as unknown as Conv[];
export const convocatoria = (id: string) => convocatorias().find((c) => c.id === id);

const ORDEN: Record<string, number> = { abierta: 0, 'en curso': 1, prevista: 2, cerrada: 3 };
export const ordenar = (l: Conv[]) => [...l].sort((a, b) => (ORDEN[a.estado] ?? 9) - (ORDEN[b.estado] ?? 9) || (b.plazas ?? 0) - (a.plazas ?? 0));

/** La convocatoria entera procede de una fuente primaria (diario oficial o web del órgano convocante). */
export const primaria = (c: Conv) => /primaria/i.test(c.verificado ?? '');

/** Un dato solo se enseña si está verificado: convocatoria de fuente primaria o campo comprobado a mano en el diario oficial. */
export const visible = (c: Conv, campo: CampoConv) => {
  const v = c[campo];
  if (v === null || v === undefined || v === '' || v === '—') return false;
  return primaria(c) || !!c.comprobado?.campos.includes(campo);
};

/** Indexable (y en el sitemap) solo si hay datos verificados que enseñar. */
export const indexable = (c: Conv) => primaria(c) || !!c.comprobado;

/** Año para el título: el de publicación si está verificado; si no, el que lleva el identificador. */
export function anio(c: Conv): string | null {
  if (visible(c, 'fechaPublicacion')) return c.fechaPublicacion!.slice(0, 4);
  return c.id.match(/20\d\d/)?.[0] ?? null;
}

export function tituloSeo(c: Conv, l: Idioma) {
  const a = anio(c);
  const nombre = c.nombreCorto[l];
  const conAnio = a && !nombre.includes(a) ? `${nombre} ${a}` : nombre;
  return l === 'ca' ? `Oposicions ${conAnio}: places, requisits, temari i dates` : `Oposiciones ${conAnio}: plazas, requisitos, temario y fechas`;
}

export const fecha = (f: string | null | undefined, l: Idioma) =>
  !f ? '' : /^\d{4}-\d{2}$/.test(f) ? new Date(f + '-15T12:00:00').toLocaleDateString(l === 'ca' ? 'ca-ES' : 'es-ES', { month: 'long', year: 'numeric' }) : fechaLarga(f, l);

export const slugCiudad = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^l'/, 'l-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const OPOSICION_AUX_AJUNTAMENTS = 'auxiliar-administratiu-ajuntaments';
export const RUTA_AUX_AJUNTAMENT = '/auxiliar-administratiu-ajuntament';

export type Ciudad = { slug: string; nombre: string; organismo: string; convocatorias: Conv[] };

/**
 * Ayuntamientos con convocatoria de auxiliar administrativo en los datos. Solo salen los que tienen al menos una
 * convocatoria con datos verificados: sin datos verificados no hay página.
 */
export function ciudadesAuxiliar(): Ciudad[] {
  const m = new Map<string, Ciudad>();
  for (const c of convocatorias()) {
    if (c.oposicion !== OPOSICION_AUX_AJUNTAMENTS || !/^Ajuntament de /.test(c.organismo)) continue;
    const nombre = c.organismo.replace(/^Ajuntament de /, '');
    const slug = slugCiudad(nombre);
    const x = m.get(slug) ?? { slug, nombre, organismo: c.organismo, convocatorias: [] };
    x.convocatorias.push(c);
    m.set(slug, x);
  }
  return [...m.values()].filter((x) => x.convocatorias.some(indexable)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'ca'));
}

export const ciudad = (slug: string) => ciudadesAuxiliar().find((c) => c.slug === slug);
