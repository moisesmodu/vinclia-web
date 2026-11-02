import 'server-only';
import { cache } from 'react';
import { inicioDiaMadrid, inicioMesMadrid, type Resultado } from '@/lib/control/comun';
import { esDeCartera, ESTADOS_SUSCRIPCION_MRR, netoEntre, type PagoStripe, type SuscripcionStripe } from '@/lib/control/stripe';
import { usuariosUnificados } from '@/lib/control/unificado';
import type { UsuarioControl } from '@/lib/control/usuarios';
import { PROYECTOS_VERCEL, vercelDe, WEBS, WEBS_PAGO, type Web } from './entidades';
import { visitasDiarias, type Dia } from './vercel';

const fmtDia = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' });
export const diaMadrid = (d: Date) => fmtDia.format(d);

/** Claves YYYY-MM-DD de los últimos n días (Madrid), del más antiguo a hoy. */
export function ultimosDias(n: number, base = new Date()): string[] {
  const hoy = diaMadrid(base);
  const [y, m, d] = hoy.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - 1, d - (n - 1 - i))).toISOString().slice(0, 10));
}

export type Serie = { clave: string; nombre: string; color: string; valores: number[] };

/** Ingresos netos (céntimos) por día y web de pago. Los reembolsos restan el día en que se hicieron. */
export function ingresosPorDia(pagos: PagoStripe[], dias: string[], webs: Web[] = WEBS_PAGO): Serie[] {
  const idx = new Map(dias.map((d, i) => [d, i]));
  return webs.map((w) => {
    const valores = dias.map(() => 0);
    for (const p of pagos) {
      if (p.proyecto !== w.stripe || p.moneda !== 'eur' || !p.cargo) continue;
      if (p.estado !== 'fallido') { const i = idx.get(diaMadrid(p.creado)); if (i != null) valores[i] += p.importe; }
      for (const r of p.reembolsos) if (r.estado !== 'failed' && r.estado !== 'canceled') { const i = idx.get(diaMadrid(r.creado)); if (i != null) valores[i] -= r.importe; }
    }
    return { clave: w.slug, nombre: w.nombre, color: w.serie, valores };
  });
}

export function altasPorDia(usuarios: UsuarioControl[], dias: string[], webs: Web[] = WEBS_PAGO): Serie[] {
  const idx = new Map(dias.map((d, i) => [d, i]));
  return webs.map((w) => {
    const valores = dias.map(() => 0);
    for (const u of usuarios) if (u.proyecto === w.control) { const i = idx.get(diaMadrid(u.alta)); if (i != null) valores[i]++; }
    return { clave: w.slug, nombre: w.nombre, color: w.serie, valores };
  });
}

/** Visitantes por día de cada web (suma de sus proyectos de Vercel). Las webs sin Analytics propio (visitasEn) no tienen serie. */
export function visitasPorDia(datos: { vercel: string; r: Resultado<Dia[]> }[], dias: string[], webs: Web[] = WEBS): Serie[] {
  return webs.filter((w) => !w.visitasEn).map((w) => {
    const valores = dias.map(() => 0);
    for (const v of vercelDe(w)) {
      const r = datos.find((x) => x.vercel === v)?.r;
      const mapa = new Map((r?.ok ? r.datos : []).map((d) => [d.dia, d.visitantes]));
      dias.forEach((d, i) => { valores[i] += mapa.get(d) ?? 0; });
    }
    return { clave: w.slug, nombre: w.nombre, color: w.serie, valores };
  });
}

/** MRR (céntimos) de la cartera en una fecha, reconstruido con las fechas de alta y cancelación. */
export function mrrEn(subs: SuscripcionStripe[], fecha: Date, filtro: (s: SuscripcionStripe) => boolean = (s) => esDeCartera(s.proyecto)) {
  const ahora = Date.now() - fecha.getTime() < 60_000;
  return subs.filter((s) => s.moneda === 'eur' && filtro(s) && (ahora
    ? ESTADOS_SUSCRIPCION_MRR.has(s.estado)
    : s.creada <= fecha && (!s.canceladaEl || s.canceladaEl > fecha) && (!s.finPrueba || s.finPrueba <= fecha) && s.estado !== 'incomplete' && s.estado !== 'incomplete_expired'))
    .reduce((t, s) => t + s.mensual, 0);
}

export type Kpi = { clave: string; titulo: string; valor: number | null; formato: 'euros' | 'numero'; antes: number | null; comparacion: string; detalle?: string };

const suma = (s: Serie[], desde: number, hasta: number) => s.reduce((t, x) => t + x.valores.slice(desde, hasta).reduce((a, b) => a + b, 0), 0);

export const tablero = cache(async () => {
  const [{ usuarios, avisos, porProyecto, stripe }, visitasRaw] = await Promise.all([usuariosUnificados(), visitasDiarias()]);
  const ahora = new Date();
  const hoy = inicioDiaMadrid(0), ayer = inicioDiaMadrid(1), mes = inicioMesMadrid();
  const mismaHoraAyer = new Date(ayer.getTime() + (ahora.getTime() - hoy.getTime()));
  const mesAnt = inicioMesMadrid(new Date(mes.getTime() - 864e5));
  const mismoPuntoMesAnt = new Date(Math.min(mesAnt.getTime() + (ahora.getTime() - mes.getTime()), mes.getTime()));
  const s = stripe.ok ? stripe.datos : null;
  const pagos = s?.pagos ?? [];
  const cartera = (p: { proyecto: string | null }) => esDeCartera(p.proyecto);

  const nHoy = netoEntre(pagos, hoy, ahora, cartera), nAyer = netoEntre(pagos, ayer, mismaHoraAyer, cartera);
  const nMes = netoEntre(pagos, mes, ahora, cartera), nMesAnt = netoEntre(pagos, mesAnt, mismoPuntoMesAnt, cartera);
  const subs = s?.suscripciones ?? [];
  const mrr = mrrEn(subs, ahora), mrr30 = mrrEn(subs, new Date(ahora.getTime() - 30 * 864e5));

  const dias44 = ultimosDias(44);
  const visitas44 = visitasPorDia(visitasRaw, dias44);
  const altas = (desde: Date, hasta: Date) => usuarios.filter((u) => u.alta >= desde && u.alta < hasta).length;
  const hace7 = inicioDiaMadrid(6), hace14 = inicioDiaMadrid(13);
  const fallosVisitas = visitasRaw.filter((v) => !v.r.ok).length;

  const kpis: Kpi[] = [
    { clave: 'hoy', titulo: 'Ingresos hoy', valor: s ? nHoy.neto : null, formato: 'euros', antes: s ? nAyer.neto : null, comparacion: 'ayer a esta hora', detalle: `${nHoy.cobros} cobro${nHoy.cobros === 1 ? '' : 's'}` },
    { clave: 'mes', titulo: 'Ingresos del mes', valor: s ? nMes.neto : null, formato: 'euros', antes: s ? nMesAnt.neto : null, comparacion: 'mismo tramo del mes pasado', detalle: nMes.reembolsado ? `−${(nMes.reembolsado / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} reembolsado` : undefined },
    { clave: 'mrr', titulo: 'MRR', valor: s ? mrr : null, formato: 'euros', antes: s ? mrr30 : null, comparacion: 'hace 30 días', detalle: `${subs.filter((x) => esDeCartera(x.proyecto) && ESTADOS_SUSCRIPCION_MRR.has(x.estado)).length} suscripciones activas` },
    { clave: 'ventas', titulo: 'Ventas del mes', valor: s ? nMes.cobros : null, formato: 'numero', antes: s ? nMesAnt.cobros : null, comparacion: 'mismo tramo del mes pasado' },
    { clave: 'usuarios', titulo: 'Usuarios nuevos 7 d', valor: porProyecto.some((p) => p.resultado.ok) ? altas(hace7, ahora) : null, formato: 'numero', antes: altas(hace14, hace7), comparacion: '7 días anteriores', detalle: `${usuarios.length.toLocaleString('es-ES')} en total` },
    { clave: 'visitas', titulo: 'Visitantes 7 d', valor: fallosVisitas === visitasRaw.length ? null : suma(visitas44, 37, 44), formato: 'numero', antes: suma(visitas44, 30, 37), comparacion: '7 días anteriores', detalle: fallosVisitas ? `${fallosVisitas} proyecto${fallosVisitas > 1 ? 's' : ''} de Vercel sin datos` : `${PROYECTOS_VERCEL.length} proyectos de Vercel` },
  ];

  const dias30 = dias44.slice(14);
  return {
    kpis, avisos, stripe, usuarios, porProyecto, pagos, subs,
    dias30,
    ingresos30: ingresosPorDia(pagos, dias30),
    altas30: altasPorDia(usuarios, dias30),
    visitas30: visitas44.map((x) => ({ ...x, valores: x.valores.slice(14) })),
    visitas44, dias44, visitasRaw,
  };
});

export type MetricasWeb = {
  ingresosMes: number | null; ingresos30: number | null; mrr: number | null; usuarios: number | null; pagan: number | null;
  altas30: number | null; visitantes30: number | null; visitantes30Ant: number | null; conversion: string;
};

/** Cifras de una web a partir del tablero ya cargado. */
export function metricasWeb(t: Awaited<ReturnType<typeof tablero>>, w: Web): MetricasWeb {
  const s = t.stripe.ok;
  const mes = inicioMesMadrid();
  const ing = w.stripe && s ? netoEntre(t.pagos, mes, new Date(), (p) => p.proyecto === w.stripe).neto : null;
  const ing30 = w.stripe && s ? t.ingresos30.find((x) => x.clave === w.slug)!.valores.reduce((a, b) => a + b, 0) : null;
  const mrr = w.stripe && s ? mrrEn(t.subs, new Date(), (x) => x.proyecto === w.stripe) : null;
  const okBase = w.control ? t.porProyecto.find((p) => p.clave === w.control)?.resultado.ok : false;
  const us = w.control && okBase ? t.usuarios.filter((u) => u.proyecto === w.control) : null;
  const pagan = us ? us.filter((u) => u.haPagado).length : null;
  const vis = t.visitas44.find((x) => x.clave === w.slug);
  const sinVisitas = !vis || !vercelDe(w).some((v) => t.visitasRaw.find((x) => x.vercel === v)?.r.ok);
  return {
    ingresosMes: ing, ingresos30: ing30, mrr, usuarios: us ? us.length : null, pagan,
    altas30: us ? us.filter((u) => u.alta >= inicioDiaMadrid(29)).length : null,
    visitantes30: sinVisitas ? null : vis!.valores.slice(14).reduce((a, b) => a + b, 0),
    visitantes30Ant: sinVisitas ? null : vis!.valores.slice(0, 14).reduce((a, b) => a + b, 0),
    conversion: us && us.length ? `${((pagan! / us.length) * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %` : '—',
  };
}
