// Plantillas programáticas del sitio de EE. UU. Cada página muestra cifras calculadas que cambian de verdad entre
// filas (impuesto estatal, cotizaciones del estado, salario mínimo, neto), no solo el nombre del estado.
import type { Tabla } from '../lib/def';
import type { PaginaProg } from './index';
import type { Bloques } from '../lib/params';
import { chequePago, horaAAnual, anualAHora, impuestoEstatal, deduccionEstandar } from '../lib/calc/us';
import { es, nombreEstado, usd, num, pct, ESTADOS_FISCAL } from '../lib/camposUS';

type Ctx = { P: Bloques; anio: number; filas: Record<string, string>[] };
const SAL = [25000, 30000, 35000, 40000, 50000, 60000, 75000, 100000, 125000, 150000];
const vecinos = (filas: Record<string, string>[], fila: Record<string, string>, k = 3) => {
  const i = filas.indexOf(fila);
  return [...filas.slice(Math.max(0, i - k), i), ...filas.slice(i + 1, i + 1 + k)];
};
const descEstado = (e: string, P: Bloques) => {
  const d = P.fiscal.estados[e];
  if (d.tipo === 'ninguno') return `${nombreEstado(e)} no cobra impuesto estatal sobre el salario`;
  if (d.tipo === 'plano') return `${nombreEstado(e)} cobra un impuesto estatal único del ${pct(d.pct)}`;
  const t = d.tramos.single;
  return `${nombreEstado(e)} tiene un impuesto estatal progresivo del ${pct(t[0].tipo)} al ${pct(t[t.length - 1].tipo)} en ${t.length} tramos`;
};
const minimo = (e: string, P: Bloques) => { const M = P.laboral.salario_minimo; return Math.max(M.estados[e]?.hora ?? M.federal, M.federal); };

export const PLANTILLAS_US: Record<string, (fila: Record<string, string>, ctx: Ctx) => PaginaProg> = {
  'us-cheque-estado'(fila, { P, anio, filas }) {
    const e = fila.estado, n = nombreEstado(e);
    const r50 = chequePago({ brutoAnual: 50000, periodos: 26, ec: 'single', estado: e }, P);
    const filasT = SAL.map((b) => { const r = chequePago({ brutoAnual: b, periodos: 26, ec: 'single', estado: e }, P); return [b, r.porPeriodo.neto, r.porPeriodo.federal, r.porPeriodo.ss + r.porPeriodo.medicare, r.porPeriodo.estatal + r.porPeriodo.contrib, r.netoAnual]; });
    const filasEc = (['single', 'mfj', 'hoh'] as const).map((ec) => { const r = chequePago({ brutoAnual: 60000, periodos: 26, ec, estado: e, hijos: ec === 'single' ? 0 : 2 }, P); return [es(ec === 'single' ? 'Soltero/a sin hijos' : ec === 'mfj' ? 'Casado/a, conjunta, 2 hijos' : 'Cabeza de familia, 2 hijos'), r.porPeriodo.neto, r.porPeriodo.federal, r.porPeriodo.estatal]; });
    const rank = ESTADOS_FISCAL.filter((x) => P.laboral.salario_minimo.estados[x]).map((x) => ({ x, neto: chequePago({ brutoAnual: 50000, periodos: 26, ec: 'single', estado: x }, P).netoAnual })).sort((a, b) => b.neto - a.neto);
    const pos = rank.findIndex((y) => y.x === e) + 1;
    const contrib = r50.contribuciones.length ? ` También se descuenta ${r50.contribuciones.map((c) => `${c.nombre} (${pct(c.pct)})`).join(' y ')}.` : '';
    const min = minimo(e, P);
    const tablas: Tabla[] = [
      { titulo: es('Cheque cada dos semanas según el salario (soltero/a, sin hijos)'), cab: [es('Salario anual'), es('Neto por cheque'), es('Federal'), es('FICA'), es('Estatal'), es('Neto anual')], formatos: ['eur0', 'eur', 'eur', 'eur', 'eur', 'eur0'], filas: filasT },
      { titulo: es('Con $60,000 al año según tu situación'), cab: [es('Situación'), es('Neto por cheque'), es('Federal'), es('Estatal')], formatos: ['txt', 'eur', 'eur', 'eur'], filas: filasEc },
      { titulo: es(`Salario mínimo en ${n} en ${anio}`), cab: [es('Por hora'), es('A la semana (40 h)'), es('Al año'), es('Neto por cheque quincenal')], formatos: ['eur', 'eur', 'eur0', 'eur'], filas: [[min, min * 40, Math.round(min * 2080), chequePago({ brutoAnual: min * 2080, periodos: 26, ec: 'single', estado: e }, P).porPeriodo.neto]] },
    ];
    return {
      titulo: `Calculadora de cheque de pago en ${n} ${anio}: cuánto te descuentan`,
      h1: `Cheque de pago en ${n} (${anio})`,
      descripcion: `Con $50,000 al año en ${n} te quedan ${usd(r50.porPeriodo.neto, 2)} netos cada dos semanas. ${descEstado(e, P)}. Tabla por salario y estado civil.`,
      intro: `<p>${descEstado(e, P)}.${contrib} Con un salario de <strong>$50,000 al año</strong>, soltero/a y sin hijos, cobrarías <strong>${usd(r50.porPeriodo.neto, 2)} netos cada dos semanas</strong>: te retienen ${usd(r50.porPeriodo.federal, 2)} de impuesto federal, ${usd(r50.porPeriodo.ss + r50.porPeriodo.medicare, 2)} de Seguro Social y Medicare y ${usd(r50.porPeriodo.estatal + r50.porPeriodo.contrib, 2)} del estado.</p><p>Con ese sueldo, ${n} es el estado número ${pos} de ${rank.length} de esta web en dinero que te queda al año (${usd(r50.netoAnual)}). El salario mínimo es de ${usd(min, 2)} la hora.</p>`,
      tablas,
      calc: 'us-cheque-pago',
      query: { estado: e },
      cifra: { e: 'Neto cada dos semanas con $50,000 al año', v: r50.porPeriodo.neto, f: 'eur', nota: 'Soltero/a sin hijos, 26 cheques al año',
        extra: [{ e: 'Neto al año', v: r50.netoAnual, f: 'eur0' }, { e: 'Salario mínimo por hora', v: min, f: 'eur' }] },
      grafico: { tipo: 'reparto', titulo: `A dónde va cada cheque de $50,000 al año en ${n}`, formato: 'eur',
        partes: [{ e: 'Neto para ti', v: r50.porPeriodo.neto }, { e: 'Impuesto federal', v: r50.porPeriodo.federal }, { e: 'Seguro Social y Medicare', v: r50.porPeriodo.ss + r50.porPeriodo.medicare }, { e: 'Estatal', v: r50.porPeriodo.estatal + r50.porPeriodo.contrib }].filter((p) => p.v > 0) },
      enlaces: filas.filter((f) => f !== fila).map((f) => ({ fila: f, texto: nombreEstado(f.estado) })),
    };
  },

  'us-cheque-estado-salario'(fila, { P, anio, filas }) {
    const e = fila.estado, n = nombreEstado(e), b = Number(fila.salario);
    const per = P.laboral.periodos_pago;
    const frec = [['Semanal', per.semanal], ['Cada dos semanas', per.quincenal], ['Dos veces al mes', per.bimensual], ['Mensual', per.mensual]] as const;
    const r = chequePago({ brutoAnual: b, periodos: 26, ec: 'single', estado: e }, P);
    const rk = chequePago({ brutoAnual: b, periodos: 26, ec: 'single', estado: e, pct401k: 6 }, P);
    const hora = anualAHora(b, 40);
    const min = minimo(e, P);
    const comp = ESTADOS_FISCAL.filter((x) => P.laboral.salario_minimo.estados[x]).map((x) => { const y = chequePago({ brutoAnual: b, periodos: 26, ec: 'single', estado: x }, P); return { x, y }; }).sort((a, c) => c.y.netoAnual - a.y.netoAnual);
    const est = impuestoEstatal({ estado: e, ec: 'single', agi: b, salarioBruto: b, imponibleFederal: Math.max(0, b - deduccionEstandar('single', P.fiscal)) }, P.fiscal);
    return {
      titulo: `$${num(b)} al año en ${n}: cuánto te queda neto (${anio})`,
      h1: `Cuánto te queda de $${num(b)} al año en ${n}`,
      descripcion: `Con $${num(b)} brutos en ${n} te quedan ${usd(r.netoAnual)} al año: ${usd(r.porPeriodo.neto, 2)} cada dos semanas. Impuesto federal, FICA y estatal (${pct(est.efectivo)}) desglosados.`,
      intro: `<p>Un sueldo de <strong>$${num(b)} al año</strong> en ${n} (unos ${usd(hora, 2)} la hora a tiempo completo, ${num(hora / min, 1)} veces el salario mínimo del estado) deja <strong>${usd(r.netoAnual)} netos al año</strong> a una persona soltera sin hijos: ${usd(r.porPeriodo.neto, 2)} en cada cheque quincenal. Los impuestos y cotizaciones se llevan el ${pct(r.tipoTotal)} del bruto.</p><p>${est.ninguno ? `${n} no cobra impuesto estatal sobre la renta, así que solo pagas el impuesto federal, Seguro Social y Medicare.` : `El impuesto de ${n} es de ${usd(est.impuesto)} al año, un ${pct(est.efectivo)} efectivo, con un tipo marginal del ${pct(est.marginal)}.`} Si aportas un 6% al 401(k), tu cheque baja solo ${usd(r.porPeriodo.neto - rk.porPeriodo.neto, 2)} aunque ahorras ${usd(rk.porPeriodo.k401, 2)}.</p>`,
      tablas: [
        { titulo: es('Desglose anual'), cab: [es('Concepto'), es('Al año'), es('Por cheque quincenal')], formatos: ['txt', 'eur', 'eur'], filas: [
          [es('Salario bruto'), b, r.brutoPeriodo],
          [es('Impuesto federal (retención)'), r.federal.anual, r.porPeriodo.federal],
          [es('Seguro Social'), r.fica.ss, r.porPeriodo.ss],
          [es('Medicare'), r.fica.medicare + r.fica.adicional, r.porPeriodo.medicare],
          [es(`Impuesto estatal de ${n}`), r.estatal.impuesto, r.porPeriodo.estatal],
          ...(r.contribTotal ? [[es('Cotizaciones estatales'), r.contribTotal, r.porPeriodo.contrib]] : []),
          [es('Neto'), r.netoAnual, r.porPeriodo.neto],
        ] },
        { titulo: es('Neto según la frecuencia de pago'), cab: [es('Frecuencia'), es('Cheques al año'), es('Neto por cheque')], formatos: ['txt', 'num0', 'eur'], filas: frec.map(([t, p]) => [es(t), p, Math.round(r.netoAnual / p * 100) / 100]) },
        { titulo: es(`Con $${num(b)} en otros estados`), cab: [es('Estado'), es('Impuesto y cotizaciones estatales'), es('Neto anual'), es('Neto por cheque quincenal')], formatos: ['txt', 'eur0', 'eur0', 'eur'], filas: comp.map(({ x, y }) => [nombreEstado(x), y.estatal.impuesto + y.contribTotal, y.netoAnual, y.porPeriodo.neto]) },
      ],
      calc: 'us-cheque-pago',
      query: { bruto: b, estado: e },
      cifra: { e: 'Neto en cada cheque quincenal', v: r.porPeriodo.neto, f: 'eur', nota: `Soltero/a sin hijos con $${num(b)} al año en ${n}`,
        extra: [{ e: 'Neto al año', v: r.netoAnual, f: 'eur0' }, { e: 'Impuestos y cotizaciones', v: r.tipoTotal, f: 'pct' }] },
      grafico: { tipo: 'reparto', titulo: `A dónde van tus $${num(b)} al año`, formato: 'eur0',
        partes: [{ e: 'Neto para ti', v: r.netoAnual }, { e: 'Impuesto federal', v: r.federal.anual }, { e: 'Seguro Social y Medicare', v: r.fica.ss + r.fica.medicare + r.fica.adicional }, { e: `Estatal de ${n}`, v: r.estatal.impuesto + r.contribTotal }].filter((p) => p.v > 0) },
      enlaces: [
        ...filas.filter((f) => f.estado === e && f !== fila).map((f) => ({ fila: f, texto: `$${num(+f.salario)} en ${n}` })),
        ...filas.filter((f) => f.salario === fila.salario && f.estado !== e).slice(0, 6).map((f) => ({ fila: f, texto: `$${num(b)} en ${nombreEstado(f.estado)}` })),
      ],
    };
  },

  'us-hora-anual'(fila, { P, anio, filas }) {
    const h = Number(fila.hora);
    const r = horaAAnual(h, 40);
    const tx = chequePago({ brutoAnual: r.anual, periodos: 26, ec: 'single', estado: 'TX' }, P);
    const ca = chequePago({ brutoAnual: r.anual, periodos: 26, ec: 'single', estado: 'CA' }, P);
    const ny = chequePago({ brutoAnual: r.anual, periodos: 26, ec: 'single', estado: 'NY' }, P);
    const jornadas = [20, 25, 30, 35, 40, 45, 50].map((hs) => { const a = horaAAnual(h, hs); const ot = hs > 40 ? (hs - 40) * h * 0.5 * 52 : 0; return [hs, a.semanal + (hs > 40 ? (hs - 40) * h * 0.5 : 0), a.mensual + ot / 12, a.anual + ot]; });
    const debajo = ESTADOS_FISCAL.filter((e) => P.laboral.salario_minimo.estados[e] && minimo(e, P) > h).map(nombreEstado);
    return {
      titulo: `$${h} la hora cuánto es al año, al mes y a la semana (${anio})`,
      h1: `$${h} la hora: cuánto es al año`,
      descripcion: `$${h} la hora a tiempo completo son ${usd(r.anual)} al año, ${usd(r.mensual)} al mes y ${usd(r.semanal)} a la semana. Neto en Texas, California y Nueva York.`,
      intro: `<p>Ganando <strong>$${h} la hora</strong> 40 horas a la semana durante 52 semanas (2,080 horas) cobras <strong>${usd(r.anual)} brutos al año</strong>, ${usd(r.mensual)} al mes, ${usd(r.quincenal)} cada dos semanas y ${usd(r.semanal)} a la semana.</p><p>Después de impuestos, a una persona soltera le quedan unos ${usd(tx.netoAnual)} al año en Texas, ${usd(ca.netoAnual)} en California y ${usd(ny.netoAnual)} en Nueva York. ${debajo.length ? `Ojo: $${h} está por debajo del salario mínimo de ${debajo.join(', ')}.` : `$${h} está por encima del salario mínimo de todos los estados de esta web.`}</p>`,
      tablas: [
        { titulo: es(`$${h} la hora según las horas por semana (con horas extra a tiempo y medio desde la hora 41)`), cab: [es('Horas/semana'), es('A la semana'), es('Al mes'), es('Al año')], formatos: ['num0', 'eur', 'eur0', 'eur0'], filas: jornadas },
        { titulo: es('Neto a tiempo completo (soltero/a)'), cab: [es('Estado'), es('Neto anual'), es('Neto cada dos semanas')], formatos: ['txt', 'eur0', 'eur'], filas: [[es('Texas'), tx.netoAnual, tx.porPeriodo.neto], [es('California'), ca.netoAnual, ca.porPeriodo.neto], [es('Nueva York'), ny.netoAnual, ny.porPeriodo.neto]] },
      ],
      calc: 'us-salario-hora',
      query: { modo: 'hora', tarifa: h },
      cifra: { e: 'Al año a tiempo completo', v: r.anual, f: 'eur0', nota: '40 horas a la semana, 52 semanas, antes de impuestos',
        extra: [{ e: 'Al mes', v: r.mensual, f: 'eur0' }, { e: 'A la semana', v: r.semanal, f: 'eur0' }] },
      grafico: { tipo: 'barras', titulo: 'Neto anual según el estado (soltero/a)', formato: 'eur0', desc: `Texas ${usd(tx.netoAnual)}, California ${usd(ca.netoAnual)}, Nueva York ${usd(ny.netoAnual)}.`,
        filas: [{ e: 'Texas', v: tx.netoAnual }, { e: 'California', v: ca.netoAnual }, { e: 'Nueva York', v: ny.netoAnual }].sort((x, y) => y.v - x.v) },
      enlaces: vecinos(filas, fila).map((f) => ({ fila: f, texto: `$${f.hora} la hora` })),
    };
  },

  'us-anual-hora'(fila, { P, anio, filas }) {
    const a = Number(fila.anual);
    const h = anualAHora(a, 40);
    const tx = chequePago({ brutoAnual: a, periodos: 26, ec: 'single', estado: 'TX' }, P);
    const fl = chequePago({ brutoAnual: a, periodos: 26, ec: 'single', estado: 'FL' }, P);
    const ca = chequePago({ brutoAnual: a, periodos: 26, ec: 'single', estado: 'CA' }, P);
    const il = chequePago({ brutoAnual: a, periodos: 26, ec: 'single', estado: 'IL' }, P);
    const hNeta = Math.round(tx.netoAnual / 2080 * 100) / 100;
    return {
      titulo: `$${num(a)} al año cuánto es por hora, al mes y neto (${anio})`,
      h1: `$${num(a)} al año: cuánto es por hora`,
      descripcion: `$${num(a)} al año son ${usd(h, 2)} la hora con 40 horas semanales, ${usd(a / 12)} al mes y ${usd(a / 26)} cada dos semanas. Neto por estado.`,
      intro: `<p>Un salario de <strong>$${num(a)} al año</strong> equivale a <strong>${usd(h, 2)} la hora</strong> trabajando 40 horas a la semana las 52 semanas del año (2,080 horas). Son ${usd(a / 12)} al mes, ${usd(a / 26)} cada dos semanas y ${usd(a / 52)} a la semana, antes de impuestos.</p><p>Después de impuestos, una persona soltera se queda con unos ${usd(tx.netoAnual)} en Texas o Florida (${usd(hNeta, 2)} netos por hora), ${usd(ca.netoAnual)} en California y ${usd(il.netoAnual)} en Illinois.</p>`,
      tablas: [
        { titulo: es(`$${num(a)} por hora según la jornada`), cab: [es('Horas por semana'), es('Por hora')], formatos: ['num0', 'eur'], filas: [30, 35, 37.5, 40, 45, 50].map((hs) => [hs, anualAHora(a, hs)]) },
        { titulo: es('Neto según el estado (soltero/a)'), cab: [es('Estado'), es('Neto anual'), es('Neto al mes'), es('Neto por hora')], formatos: ['txt', 'eur0', 'eur0', 'eur'], filas: [['Texas', tx], ['Florida', fl], ['California', ca], ['Illinois', il]].map(([n, r]: any) => [es(n), r.netoAnual, Math.round(r.netoAnual / 12), Math.round(r.netoAnual / 2080 * 100) / 100]) },
      ],
      calc: 'us-salario-hora',
      query: { modo: 'anual', anual: a },
      cifra: { e: 'Por hora con 40 horas a la semana', v: h, f: 'eur', nota: '2,080 horas al año, antes de impuestos',
        extra: [{ e: 'Al mes', v: a / 12, f: 'eur0' }, { e: 'Neto por hora en Texas', v: hNeta, f: 'eur' }] },
      grafico: { tipo: 'barras', titulo: 'Neto anual según el estado (soltero/a)', formato: 'eur0', desc: `Texas ${usd(tx.netoAnual)}, Florida ${usd(fl.netoAnual)}, California ${usd(ca.netoAnual)}, Illinois ${usd(il.netoAnual)}.`,
        filas: [{ e: 'Texas', v: tx.netoAnual }, { e: 'Florida', v: fl.netoAnual }, { e: 'California', v: ca.netoAnual }, { e: 'Illinois', v: il.netoAnual }].sort((x, y) => y.v - x.v) },
      enlaces: vecinos(filas, fila).map((f) => ({ fila: f, texto: `$${num(+f.anual)} al año` })),
    };
  },
};
