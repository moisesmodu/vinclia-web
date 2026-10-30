// Motor del calendario laboral: festivos de una comunidad o de un municipio, días laborables, días hábiles
// administrativos (Ley 39/2015, art. 30) y puentes. Funciones puras: las usan la calculadora en el navegador,
// las páginas por combinación y las fichas. Los datos salen de params/es/<año>/calendario.json.
import cal2026 from '../../../params/es/2026/calendario.json';
import cal2027 from '../../../params/es/2027/calendario.json';
import { sumarDias } from './base';

export type Origen = 'nacional' | 'sustituible' | 'autonomico' | 'local';
export interface Festivo { f: string; n: { es: string; ca: string }; o: Origen | string }
export interface Comunidad { n: { es: string; ca: string }; slug?: { es: string; ca: string }; festivos: Festivo[]; completo?: boolean; paginas?: boolean; verificado?: boolean; fuente?: { nombre: string; url: string }; nota?: string }
export interface Municipio { id: string; n: { es: string; ca: string }; ccaa: string; provincia: string; capital: boolean; estado: 'publicado' | 'pendiente' | string; festivos: Festivo[]; verificado?: boolean; fuente?: { nombre: string; url: string }; nota?: string }
export interface Calendario { anio: number; comunidades: Record<string, Comunidad>; municipios?: Municipio[] }

export const CALENDARIOS: Record<number, Calendario> = { 2026: cal2026 as any, 2027: cal2027 as any };
export const ANIOS_CAL = Object.keys(CALENDARIOS).map(Number).sort();

/** «c-AN» (comunidad) o «m-malaga» (municipio). */
export type Lugar = string;
export const lugarComunidad = (cc: string): Lugar => `c-${cc}`;
export const lugarMunicipio = (id: string): Lugar => `m-${id}`;

export function municipio(id: string, anio = 2027): Municipio | undefined {
  return CALENDARIOS[anio]?.municipios?.find((m) => m.id === id) ?? CALENDARIOS[2027].municipios!.find((m) => m.id === id);
}
/** Comunidad del lugar: la propia o la del municipio. */
export function ccaaDe(lugar: Lugar): string {
  return lugar.startsWith('m-') ? municipio(lugar.slice(2))!.ccaa : lugar.slice(2);
}

export interface FestivosAnio { festivos: Festivo[]; conDatos: boolean; completo: boolean; sinLocales: boolean }

/** Festivos de un lugar en un año: los de su comunidad y, si es un municipio con datos, sus dos locales. */
export function festivosLugar(lugar: Lugar, anio: number): FestivosAnio {
  const cal = CALENDARIOS[anio];
  const cc = ccaaDe(lugar);
  const com = cal?.comunidades[cc];
  if (!com) return { festivos: [], conDatos: false, completo: false, sinLocales: lugar.startsWith('m-') };
  const out = [...com.festivos];
  let sinLocales = false;
  if (lugar.startsWith('m-')) {
    const m = cal.municipios?.find((x) => x.id === lugar.slice(2));
    if (m && m.estado === 'publicado') { for (const f of m.festivos) if (!out.some((x) => x.f === f.f)) out.push(f); }
    else sinLocales = true;
  }
  out.sort((a, b) => a.f.localeCompare(b.f));
  return { festivos: out, conDatos: true, completo: com.completo !== false, sinLocales };
}

/** Día de la semana de una fecha ISO: 0 = lunes … 6 = domingo. */
export const diaSemana = (iso: string) => (new Date(iso + 'T00:00:00Z').getUTCDay() + 6) % 7;
export const esFinde = (iso: string) => diaSemana(iso) >= 5;

/** Mapa fecha → festivo de todos los años que toque un rango. */
function mapaFestivos(lugar: Lugar, desde: string, hasta: string) {
  const mapa = new Map<string, Festivo>();
  const sinDatos: number[] = [], incompletos: number[] = [];
  let sinLocales = false;
  for (let a = +desde.slice(0, 4); a <= +hasta.slice(0, 4); a++) {
    const r = festivosLugar(lugar, a);
    if (!r.conDatos) { sinDatos.push(a); continue; }
    if (!r.completo) incompletos.push(a);
    if (r.sinLocales) sinLocales = true;
    for (const f of r.festivos) mapa.set(f.f, f);
  }
  return { mapa, sinDatos, incompletos, sinLocales };
}

export interface Cuenta {
  naturales: number; laborables: number; findes: number;
  festivos: Festivo[]; // festivos de lunes a viernes dentro del rango
  festivosFinde: Festivo[]; // festivos que caen en sábado o domingo
  sinDatos: number[]; incompletos: number[]; sinLocales: boolean;
}

/** Días laborables (lunes a viernes no festivos) entre dos fechas, las dos incluidas. */
export function contarLaborables(lugar: Lugar, desde: string, hasta: string): Cuenta {
  const { mapa, sinDatos, incompletos, sinLocales } = mapaFestivos(lugar, desde, hasta);
  const c: Cuenta = { naturales: 0, laborables: 0, findes: 0, festivos: [], festivosFinde: [], sinDatos, incompletos, sinLocales };
  if (desde > hasta) return c;
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) {
    c.naturales++;
    const f = mapa.get(d);
    if (esFinde(d)) { c.findes++; if (f) c.festivosFinde.push(f); }
    else if (f) c.festivos.push(f);
    else c.laborables++;
  }
  return c;
}

export interface Plazo { fin: string; naturales: number; saltados: { f: string; motivo: 'finde' | Festivo }[]; sinDatos: number[]; incompletos: number[]; sinLocales: boolean }

/**
 * Plazo en días hábiles (Ley 39/2015, art. 30.2): se cuenta desde el día siguiente a la notificación y se
 * excluyen los sábados, los domingos y los festivos del lugar. Devuelve el último día del plazo.
 */
export function sumarHabiles(lugar: Lugar, notificacion: string, dias: number): Plazo {
  const n = Math.max(1, Math.floor(dias));
  const { mapa, sinDatos, incompletos, sinLocales } = mapaFestivos(lugar, notificacion, sumarDias(notificacion, n * 2 + 40));
  const saltados: Plazo['saltados'] = [];
  let d = notificacion, cuenta = 0;
  while (cuenta < n) {
    d = sumarDias(d, 1);
    if (esFinde(d)) { saltados.push({ f: d, motivo: 'finde' }); continue; }
    const f = mapa.get(d);
    if (f) { saltados.push({ f: d, motivo: f }); continue; }
    cuenta++;
  }
  const naturales = Math.round((Date.parse(d) - Date.parse(notificacion)) / 86400000);
  return { fin: d, naturales, saltados, sinDatos, incompletos, sinLocales };
}

export interface ResumenAnio { anio: number; laborables: number; festivosSemana: number; festivosFinde: number; total: number; completo: boolean }
export function resumenAnio(lugar: Lugar, anio: number): ResumenAnio {
  const c = contarLaborables(lugar, `${anio}-01-01`, `${anio}-12-31`);
  return { anio, laborables: c.laborables, festivosSemana: c.festivos.length, festivosFinde: c.festivosFinde.length, total: c.festivos.length + c.festivosFinde.length, completo: !c.incompletos.length };
}

export interface Bloque { desde: string; hasta: string; dias: number; festivos: Festivo[] }
export interface Puente { dia: string; desde: string; hasta: string; dias: number; festivos: Festivo[] }

/**
 * Descansos de un año: tramos de 3 o más días seguidos sin trabajar (fin de semana unido a festivos) y puentes,
 * es decir, un único día laborable entre dos tramos de descanso que, si se coge libre, deja 4 o más días seguidos.
 */
export function descansos(lugar: Lugar, anio: number): { largos: Bloque[]; puentes: Puente[] } {
  const ini = `${anio - 1}-12-25`, fin = `${anio + 1}-01-07`;
  const { mapa } = mapaFestivos(lugar, ini, fin);
  const libre = (d: string) => esFinde(d) || mapa.has(d);
  // Tramos de días libres seguidos
  const tramos: Bloque[] = [];
  let act: Bloque | null = null;
  for (let d = ini; d <= fin; d = sumarDias(d, 1)) {
    if (libre(d)) {
      if (!act) act = { desde: d, hasta: d, dias: 0, festivos: [] };
      act.hasta = d; act.dias++;
      const f = mapa.get(d); if (f) act.festivos.push(f);
    } else if (act) { tramos.push(act); act = null; }
  }
  if (act) tramos.push(act);
  const delAnio = (b: { desde: string; hasta: string }) => b.hasta >= `${anio}-01-01` && b.desde <= `${anio}-12-31`;
  const largos = tramos.filter((b) => b.dias >= 3 && b.festivos.some((f) => f.f.startsWith(`${anio}-`)) && delAnio(b));
  const puentes: Puente[] = [];
  for (let i = 0; i + 1 < tramos.length; i++) {
    const a = tramos[i], b = tramos[i + 1];
    const dia = sumarDias(a.hasta, 1);
    if (sumarDias(dia, 1) !== b.desde) continue; // más de un día laborable entre medias
    if (!dia.startsWith(`${anio}-`)) continue;
    const festivos = [...a.festivos, ...b.festivos].filter((f) => f.f.startsWith(`${anio}-`));
    if (!festivos.length) continue;
    const dias = a.dias + 1 + b.dias;
    if (dias >= 4) puentes.push({ dia, desde: a.desde, hasta: b.hasta, dias, festivos });
  }
  return { largos, puentes };
}

/** Lugares con datos para un selector: las comunidades con página y los municipios con sus festivos publicados. */
export function lugares(anio = 2027) {
  const cal = CALENDARIOS[anio];
  const com = Object.entries(cal.comunidades).filter(([, c]) => c.paginas !== false).map(([k, c]) => ({ v: lugarComunidad(k), n: c.n, cc: k }));
  const mun = (cal.municipios ?? []).filter((m) => m.estado === 'publicado').map((m) => ({ v: lugarMunicipio(m.id), n: m.n, cc: m.ccaa }));
  return { com, mun };
}

export const nombreLugar = (lugar: Lugar, lang: 'es' | 'ca') =>
  lugar.startsWith('m-') ? municipio(lugar.slice(2))!.n[lang] : CALENDARIOS[2027].comunidades[lugar.slice(2)].n[lang];
