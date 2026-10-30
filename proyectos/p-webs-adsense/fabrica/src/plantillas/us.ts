// Plantillas programáticas del sitio de EE. UU. Cada página muestra cifras calculadas que cambian de verdad entre
// filas (impuesto estatal, cotizaciones del estado, salario mínimo, neto), no solo el nombre del estado.
import type { Tabla } from '../lib/def';
import type { PaginaProg } from './index';
import type { Bloques } from '../lib/params';
import { chequePago, horaAAnual, anualAHora, impuestoEstatal, deduccionEstandar, horasExtra, impuestoFederal } from '../lib/calc/us';
import { r2 } from '../lib/calc/base';
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
      faq: [
        { p: `¿Cuánto me queda de $${num(b)} al año en ${n}?`, r: `Soltero/a y sin hijos, ${usd(r.netoAnual)} al año: ${usd(r.porPeriodo.neto, 2)} cada dos semanas, ${usd(r.netoAnual / 12)} al mes o ${usd(r.netoAnual / 52, 2)} a la semana. Los impuestos y cotizaciones se llevan ${usd(b - r.netoAnual)} (${pct(r.tipoTotal)}).` },
        { p: `¿Cuánto paga de impuesto estatal un sueldo de $${num(b)} en ${n}?`, r: est.ninguno ? `Nada: ${n} no cobra impuesto estatal sobre el salario.${r.contribTotal ? ` Sí descuenta ${usd(r.contribTotal)} al año de cotizaciones estatales.` : ''} Frente a ${nombreEstado(comp[comp.length - 1].x)}, te quedan ${usd(r.netoAnual - comp[comp.length - 1].y.netoAnual)} más al año.` : `${usd(est.impuesto)} al año (${pct(est.efectivo)} del sueldo), unos ${usd(r.porPeriodo.estatal, 2)} por cheque quincenal. Con el mismo sueldo, en ${nombreEstado(comp[0].x)} te quedarían ${usd(comp[0].y.netoAnual - r.netoAnual)} más al año.` },
        { p: `¿Y si aporto un 6 % al 401(k) con $${num(b)} en ${n}?`, r: `Aportas ${usd(rk.aporte401k)} al año, pero como baja tus impuestos, tu cheque quincenal solo baja de ${usd(r.porPeriodo.neto, 2)} a ${usd(rk.porPeriodo.neto, 2)}: ${usd(r.netoAnual - rk.netoAnual)} menos al año en mano por ${usd(rk.aporte401k)} ahorrados.` },
      ],
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
      faq: [
        { p: `¿$${h} la hora cuánto es al año?`, r: `${usd(r.anual)} brutos con 40 horas a la semana y 52 semanas; con 35 horas, ${usd(horaAAnual(h, 35).anual)}; con 30, ${usd(horaAAnual(h, 30).anual)}.` },
        { p: `¿Cuánto me queda neto ganando $${h} la hora?`, r: `Soltero/a a tiempo completo, unos ${usd(tx.netoAnual)} al año en Texas (${usd(tx.porPeriodo.neto, 2)} cada dos semanas), ${usd(ca.netoAnual)} en California y ${usd(ny.netoAnual)} en Nueva York.` },
        { p: `¿Cuánto cobro con 10 horas extra a la semana a $${h} la hora?`, r: `Las horas extra se pagan a ${usd(h * P.laboral.horas_extra.factor, 2)}: 50 horas a la semana son ${usd(40 * h + 10 * h * P.laboral.horas_extra.factor, 2)} brutos, ${usd(10 * h * P.laboral.horas_extra.factor, 2)} más que con 40 horas.` },
      ],
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
  'us-impuesto-estatal-estado'(fila, { P, anio, filas }) {
    const e = fila.estado, n = nombreEstado(e);
    const F = P.fiscal, d = F.estados[e];
    const calc = (x: string, ing: number, ec: 'single' | 'mfj' = 'single', dep = 0) => impuestoEstatal({ estado: x, ec, agi: ing, salarioBruto: ing, imponibleFederal: Math.max(0, ing - deduccionEstandar(ec, F)), dependientes: dep }, F);
    const r60 = calc(e, 60000);
    const quince = ESTADOS_FISCAL.filter((x) => P.laboral.salario_minimo.estados[x]);
    const rank = quince.map((x) => ({ x, imp: calc(x, 60000).impuesto })).sort((a, b) => a.imp - b.imp);
    const conImp = rank.filter((y) => y.imp > 0);
    const caro = rank[rank.length - 1];
    const medConImp = conImp.reduce((s, y) => s + y.imp, 0) / (conImp.length || 1);
    const pos = rank.findIndex((y) => y.x === e) + 1;
    const ings = [30000, 40000, 50000, 60000, 75000, 100000, 150000, 250000];
    const cheque = chequePago({ brutoAnual: 60000, periodos: 26, ec: 'single', estado: e }, P);
    const contrib = cheque.contribuciones;
    const ninguno = d.tipo === 'ninguno';
    const tramos = !ninguno && d.tipo !== 'plano' ? d.tramos.single as { hasta: number | null; tipo: number }[] : [];
    let desde = 0;
    const tablas: Tabla[] = [
      { titulo: es(`Impuesto estatal de ${n} según el ingreso (${anio})`), cab: [es('Ingreso (AGI)'), es('Soltero/a'), es('Tipo efectivo'), es('Marginal'), es('Casados, conjunta, 2 hijos')], formatos: ['eur0', 'eur0', 'pct', 'pct', 'eur0'],
        filas: ings.map((i) => { const s = calc(e, i), m = calc(e, i, 'mfj', 2); return [i, s.impuesto, s.efectivo, s.marginal, m.impuesto]; }) },
      ...(tramos.length ? [{ titulo: es(`Tramos de ${n} para solteros`), cab: [es('Renta imponible'), es('Tipo')], formatos: ['txt', 'pct'] as const, filas: tramos.map((t) => { const f = [`${usd(desde)} – ${t.hasta == null ? 'en adelante' : usd(t.hasta)}`, t.tipo]; desde = t.hasta ?? desde; return f; }) } as Tabla] : []),
      { titulo: es('Con $60,000 en los 15 estados de esta web (soltero/a)'), cab: [es('Estado'), es('Impuesto estatal'), es('Tipo efectivo')], formatos: ['txt', 'eur0', 'pct'], filas: rank.map((y) => [nombreEstado(y.x), y.imp, calc(y.x, 60000).efectivo]) },
    ];
    const tipoTxt = ninguno ? 'no cobra impuesto estatal sobre la renta' : d.tipo === 'plano' ? `cobra un tipo único del ${pct(d.pct)}` : `tiene ${tramos.length} tramos, del ${pct(tramos[0].tipo)} al ${pct(tramos[tramos.length - 1].tipo)}`;
    return {
      titulo: `Impuesto estatal de ${n} ${anio}: ${ninguno ? 'sin impuesto sobre la renta' : d.tipo === 'plano' ? `tipo único del ${pct(d.pct)}` : 'tramos y cuánto pagas'}`,
      h1: `Impuesto estatal sobre la renta en ${n} (${anio})`,
      descripcion: ninguno ? `${n} no cobra impuesto estatal sobre el salario: con $60,000 te ahorras ${usd(caro.imp)} frente a ${nombreEstado(caro.x)}. Qué sí se descuenta en el cheque.` : `${n} ${tipoTxt}. Con $60,000 pagas ${usd(r60.impuesto)} al año (${pct(r60.efectivo)}). Tabla por ingreso y comparación con 15 estados.`,
      intro: ninguno
        ? `<p><strong>${n} ${tipoTxt}</strong>: de tu cheque solo salen el impuesto federal, el Seguro Social y Medicare${contrib.length ? `, y ${contrib.map((c) => `${c.nombre} (${pct(c.pct)})`).join(' y ')}` : ''}.</p><p>Con un sueldo de $60,000, una persona soltera se ahorra ${usd(caro.imp)} al año frente a ${nombreEstado(caro.x)}, el estado más caro de esta web con ese ingreso, y ${usd(medConImp)} frente a la media de los ${conImp.length} estados que sí lo cobran. Le quedan ${usd(cheque.porPeriodo.neto, 2)} netos cada dos semanas.</p>`
        : `<p><strong>${n} ${tipoTxt}</strong>${d.base === 'federal_imponible' ? ', y parte de la renta imponible federal' : d.base === 'salario_bruto' ? ', y grava el salario bruto sin deducción estándar' : ''}. Con <strong>$60,000 al año</strong>, soltero/a, pagas <strong>${usd(r60.impuesto)}</strong> (un ${pct(r60.efectivo)} efectivo y un ${pct(r60.marginal)} marginal), unos ${usd(cheque.porPeriodo.estatal, 2)} por cheque quincenal.</p><p>Es el ${pos}.º más barato de los 15 estados de esta web con ese ingreso: ${usd(Math.abs(r60.impuesto - medConImp))} ${r60.impuesto < medConImp ? 'menos' : 'más'} que la media de los que cobran impuesto (${usd(medConImp)}).${contrib.length ? ` Además, el cheque descuenta ${contrib.map((c) => `${c.nombre} (${pct(c.pct)})`).join(' y ')}.` : ''}</p>`,
      tablas,
      calc: 'us-impuesto-estatal',
      query: { ingreso: 60000, estado: e },
      cifra: { e: 'Impuesto estatal con $60,000 (soltero/a)', v: r60.impuesto, f: 'eur0', nota: ninguno ? `${n} no tiene impuesto sobre la renta` : `${pct(r60.efectivo)} efectivo · marginal del ${pct(r60.marginal)}`,
        extra: [{ e: 'Con $100,000', v: calc(e, 100000).impuesto, f: 'eur0' }, { e: 'Por cheque quincenal ($60,000)', v: cheque.porPeriodo.estatal, f: 'eur' }] },
      grafico: { tipo: 'barras', titulo: 'Impuesto estatal anual con $60,000 (soltero/a)', formato: 'eur0',
        desc: `De ${usd(rank[0].imp)} en ${nombreEstado(rank[0].x)} a ${usd(caro.imp)} en ${nombreEstado(caro.x)}. ${n}: ${usd(r60.impuesto)}.`,
        filas: [...rank].reverse().map((y) => ({ e: nombreEstado(y.x), v: y.imp, act: y.x === e })) },
      faq: [
        { p: `¿Cuánto impuesto estatal pago con $50,000 en ${n}?`, r: ninguno ? `Nada: ${n} no tiene impuesto estatal sobre la renta. Con $50,000 en ${nombreEstado(caro.x)} pagarías ${usd(calc(caro.x, 50000).impuesto)}.` : `${usd(calc(e, 50000).impuesto)} al año si eres soltero/a (${pct(calc(e, 50000).efectivo)}). Casados con dos hijos, ${usd(calc(e, 50000, 'mfj', 2).impuesto)}.` },
        { p: `¿Cuánto me retienen de impuesto estatal en cada cheque en ${n}?`, r: ninguno ? `Nada de impuesto estatal.${contrib.length ? ` Sí ${usd(cheque.porPeriodo.contrib, 2)} por cheque de cotizaciones estatales con $60,000.` : ''} Con $60,000, el cheque quincenal neto es de ${usd(cheque.porPeriodo.neto, 2)}.` : `Con $60,000 y cobro cada dos semanas, unos ${usd(cheque.porPeriodo.estatal, 2)} por cheque${cheque.porPeriodo.contrib ? ` más ${usd(cheque.porPeriodo.contrib, 2)} de cotizaciones estatales` : ''}. El cheque neto queda en ${usd(cheque.porPeriodo.neto, 2)}.` },
        ninguno ? { p: `¿Cuánto me ahorro de impuestos viviendo en ${n}?`, r: `Con $60,000 al año, ${usd(caro.imp)} frente a ${nombreEstado(caro.x)} y ${usd(medConImp)} frente a la media de los ${conImp.length} estados de esta web que cobran impuesto. Con $100,000, ${usd(calc(caro.x, 100000).impuesto)} frente a ${nombreEstado(caro.x)}.` } : { p: `¿Cuál es el tipo máximo del impuesto de ${n}?`, r: d.tipo === 'plano' ? `El mismo para todos: ${pct(d.pct)}${d.sobretasa ? `, más una sobretasa del ${pct(d.sobretasa.pct)} por encima de ${usd(d.sobretasa.umbral)}` : ''}.` : `El ${pct(tramos[tramos.length - 1].tipo)}, a partir de ${usd(tramos[tramos.length - 2].hasta!)} de renta imponible para solteros. Con $60,000 tu tipo marginal es el ${pct(r60.marginal)}.` },
      ],
      enlaces: [
        ...filas.filter((f) => f !== fila).map((f) => ({ fila: f, texto: `Impuesto estatal de ${nombreEstado(f.estado)}` })),
        { col: 'cheque-por-estado', fila, texto: `Cheque de pago en ${n}` },
      ],
    };
  },

  'us-overtime-estado'(fila, { P, anio, filas }) {
    const e = fila.estado, n = nombreEstado(e);
    const H = P.laboral.horas_extra;
    const min = minimo(e, P);
    const diaria = H.estados?.[e];
    const otMin = r2(min * H.factor);
    // Neto de 10 horas extra a la semana todo el año: diferencia entre el cheque con y sin ellas
    const netoExtra = (tarifa: number) => {
      const base = chequePago({ brutoAnual: tarifa * 2080, periodos: 52, ec: 'single', estado: e }, P);
      const con = chequePago({ brutoAnual: tarifa * 2080 + tarifa * H.factor * 10 * 52, periodos: 52, ec: 'single', estado: e }, P);
      return { bruto: r2(tarifa * H.factor * 10), neto: r2((con.netoAnual - base.netoAnual) / 52) };
    };
    const tarifas = [...new Set([min, 15, 18, 20, 25, 30, 40].filter((t) => t >= min))].sort((a, b) => a - b);
    const filasT = tarifas.map((t) => { const w = horasExtra({ tarifa: t, horasSemana: 50 }, P.laboral); const x = netoExtra(t); return [t, w.tarifaExtra, w.total, x.bruto, x.neto]; });
    const x20 = netoExtra(20);
    const quince = ESTADOS_FISCAL.filter((x) => P.laboral.salario_minimo.estados[x]);
    const comp = quince.map((x) => { const b = chequePago({ brutoAnual: 41600, periodos: 52, ec: 'single', estado: x }, P), c = chequePago({ brutoAnual: 41600 + 300 * 52, periodos: 52, ec: 'single', estado: x }, P); return { x, v: r2((c.netoAnual - b.netoAnual) / 52) }; }).sort((a, b) => b.v - a.v);
    const posN = comp.findIndex((y) => y.x === e) + 1;
    const ejCA = diaria ? horasExtra({ tarifa: 20, horasSemana: 50, estado: e, horasDia: [12.5, 12.5, 12.5, 12.5] }, P.laboral) : null;
    const ejFed = horasExtra({ tarifa: 20, horasSemana: 50 }, P.laboral);
    return {
      titulo: `Overtime en ${n} ${anio}: horas extra y cuánto te queda`,
      h1: `Horas extra (overtime) en ${n} (${anio})`,
      descripcion: `En ${n} la hora extra al salario mínimo se paga a ${usd(otMin, 2)}. A $20 la hora, 10 horas extra son ${usd(x20.bruto)} brutos y te quedan ${usd(x20.neto)} netos.`,
      intro: `<p>En ${n} las horas extra se pagan a <strong>tiempo y medio</strong> a partir de la hora ${H.umbral_semanal + 1} de la semana${diaria ? `, y además por día: tiempo y medio pasadas ${diaria.umbral_diario} horas y el doble pasadas ${diaria.umbral_doble}` : ''}. Con el salario mínimo del estado (${usd(min, 2)} la hora) la hora extra vale <strong>${usd(otMin, 2)}</strong>.</p><p>A $20 la hora, 10 horas extra a la semana son ${usd(x20.bruto)} brutos, pero después del impuesto federal, FICA${quince.includes(e) && P.fiscal.estados[e].tipo !== 'ninguno' ? ' y el impuesto de ' + n : ''} te quedan unos <strong>${usd(x20.neto)}</strong>: el ${pct(r2(x20.neto / x20.bruto * 100))}. ${posN === 1 ? `Es el estado de esta web donde más se queda de cada hora extra.` : `Es el ${posN}.º de 15 estados en lo que te queda de cada hora extra.`}${ejCA ? ` Ojo: con 4 días de 12,5 horas cobras ${usd(ejCA.total, 2)} en la semana, ${usd(ejCA.total - ejFed.total, 2)} más que con la regla solo semanal.` : ''}</p>`,
      tablas: [
        { titulo: es(`Semana de 50 horas en ${n} según la tarifa`), cab: [es('Por hora'), es('Hora extra'), es('Bruto de la semana'), es('Bruto de 10 h extra'), es('Neto de 10 h extra')], formatos: ['eur', 'eur', 'eur', 'eur', 'eur'], filas: filasT },
        { titulo: es('Neto de 10 horas extra a $20 la hora en cada estado'), cab: [es('Estado'), es('Te quedan a la semana')], formatos: ['txt', 'eur'], filas: comp.map((y) => [nombreEstado(y.x), y.v]) },
      ],
      calc: 'us-overtime',
      query: diaria ? { tarifa: 20, horas: 50, ca: 1, dias: 4 } : { tarifa: 20, horas: 50 },
      cifra: { e: 'Hora extra con el salario mínimo', v: otMin, f: 'eur', nota: `Tiempo y medio sobre ${usd(min, 2)} la hora en ${n}`,
        extra: [{ e: 'Neto de 10 h extra a $20', v: x20.neto, f: 'eur' }, { e: 'Salario mínimo', v: min, f: 'eur' }] },
      grafico: { tipo: 'barras', titulo: 'Lo que te queda de 10 horas extra a $20 la hora', formato: 'eur0',
        desc: `De ${usd(comp[comp.length - 1].v)} en ${nombreEstado(comp[comp.length - 1].x)} a ${usd(comp[0].v)} en ${nombreEstado(comp[0].x)}. ${n}: ${usd(comp[posN - 1].v)}.`,
        filas: comp.map((y) => ({ e: nombreEstado(y.x), v: y.v, act: y.x === e })) },
      faq: [
        { p: `¿Cuánto se paga la hora extra en ${n}?`, r: `Una vez y media tu tarifa normal: con el mínimo de ${usd(min, 2)}, ${usd(otMin, 2)}; con $20 la hora, ${usd(20 * H.factor, 2)}.${diaria ? ` En ${n} las horas que pasan de ${diaria.umbral_doble} en un día se pagan al doble (${usd(20 * diaria.factor_doble, 2)} a $20 la hora).` : ''}` },
        { p: `¿Cuánto me queda neto de las horas extra en ${n}?`, r: `A $20 la hora, de 10 horas extra (${usd(x20.bruto)} brutos) te quedan unos ${usd(x20.neto)}. A $30, de ${usd(netoExtra(30).bruto)} te quedan ${usd(netoExtra(30).neto)}. La retención sube porque el cheque es más alto, pero la ley de 2025 deja deducir la «media» del tiempo y medio en la declaración.` },
      ],
      enlaces: [
        ...filas.filter((f) => f !== fila).map((f) => ({ fila: f, texto: `Overtime en ${nombreEstado(f.estado)}` })),
        { col: 'cheque-por-estado', fila, texto: `Cheque de pago en ${n}` },
      ],
    };
  },

  'us-credito-hijos-n'(fila, { P, anio, filas }) {
    const k = Number(fila.hijos);
    const C = P.fiscal.credito_hijos;
    const ctc = (ing: number, ec: 'single' | 'mfj' | 'hoh') => impuestoFederal({ ec, salarios: ing, hijos: k, anio: P.anio }, P).ctc;
    const max = k * C.por_hijo, maxReemb = k * C.reembolsable_max;
    // Ingreso mínimo (en saltos de $500) con el que una cabeza de familia cobra el crédito completo
    let pleno = 0;
    for (let i = 2500; i <= 200000; i += 500) if (ctc(i, 'hoh').total >= max) { pleno = i; break; }
    const finSingle = C.umbral_reduccion.single + Math.ceil(max / C.reduccion_por_1000) * 1000;
    const finMfj = C.umbral_reduccion.mfj + Math.ceil(max / C.reduccion_por_1000) * 1000;
    const ings = [10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 220000, 250000, 420000, 450000];
    const r30 = ctc(30000, 'hoh'), r15 = ctc(15000, 'hoh');
    const ud = k === 1 ? 'hijo' : 'hijos';
    return {
      titulo: `Crédito por ${k} ${ud} ${anio}: cuánto te devuelven según tu ingreso`,
      h1: `Crédito tributario por ${k} ${ud} (${anio})`,
      descripcion: `Con ${k} ${ud} menor${k === 1 ? '' : 'es'} de 17 el crédito llega a ${usd(max)}, de los que ${usd(maxReemb)} son reembolsables. Con $30,000 recibes ${usd(r30.total)}. Tabla por ingreso.`,
      intro: `<p>Con <strong>${k} ${ud} menor${k === 1 ? '' : 'es'} de 17 años</strong> con número de Seguro Social, el crédito tributario por hijos puede llegar a <strong>${usd(max)}</strong> (${usd(C.por_hijo)} por hijo). Una parte rebaja tu impuesto federal y otra, de hasta ${usd(maxReemb)}, te la devuelven aunque no debas impuesto (el ACTC), siempre que tus ingresos del trabajo pasen de ${usd(C.umbral_ingreso_ganado)}.</p><p>Una cabeza de familia necesita ganar unos <strong>${usd(pleno)}</strong> para cobrar el crédito completo; con $15,000 recibe ${usd(r15.total)} y con $30,000, ${usd(r30.total)}. Por arriba, el crédito baja ${usd(C.reduccion_por_1000)} por cada $1,000 que pases de ${usd(C.umbral_reduccion.single)} (${usd(C.umbral_reduccion.mfj)} si declaran juntos) y desaparece del todo hacia ${usd(finSingle)} (${usd(finMfj)} en conjunta).</p>`,
      tablas: [
        { titulo: es(`Crédito con ${k} ${ud} según el ingreso del trabajo`), cab: [es('Ingreso'), es('Cabeza de familia'), es('De ellos, reembolsable'), es('Casados, conjunta')], formatos: ['eur0', 'eur0', 'eur0', 'eur0'],
          filas: ings.map((i) => { const h = ctc(i, 'hoh'); return [i, h.total, h.reembolsable, ctc(i, 'mfj').total]; }) },
        { titulo: es('Crédito máximo según el número de hijos'), cab: [es('Hijos'), es('Crédito máximo'), es('Reembolsable máximo')], formatos: ['num0', 'eur0', 'eur0'], filas: [1, 2, 3, 4, 5].map((h) => [h, h * C.por_hijo, h * C.reembolsable_max]) },
      ],
      calc: 'us-credito-hijos',
      query: { ninos: k, ingreso: 30000, ec: 'hoh' },
      cifra: { e: `Crédito máximo con ${k} ${ud}`, v: max, f: 'eur0', nota: `${usd(maxReemb)} reembolsables · completo desde unos ${usd(pleno)} de ingreso`,
        extra: [{ e: 'Con $30,000 (cabeza de familia)', v: r30.total, f: 'eur0' }, { e: 'Con $15,000', v: r15.total, f: 'eur0' }] },
      grafico: { tipo: 'barras', titulo: `Crédito por ${k} ${ud} según el ingreso (cabeza de familia)`, formato: 'eur0',
        desc: `De ${usd(ctc(10000, 'hoh').total)} con $10,000 a ${usd(max)} desde ${usd(pleno)}.`,
        filas: [10000, 15000, 20000, 30000, 40000, 50000, 75000].map((i) => ({ e: usd(i), v: ctc(i, 'hoh').total, act: i === 30000 })) },
      faq: [
        { p: `¿Cuánto me dan por ${k} ${ud} si gano $20,000?`, r: `Como cabeza de familia, ${usd(ctc(20000, 'hoh').total)}, de los que ${usd(ctc(20000, 'hoh').reembolsable)} son reembolsables. Casados declarando juntos con el mismo ingreso, ${usd(ctc(20000, 'mfj').total)}.` },
        { p: `¿A partir de qué ingreso cobro el crédito completo por ${k} ${ud}?`, r: `Desde unos ${usd(pleno)} como cabeza de familia: por debajo, tu impuesto no alcanza para usar todo el crédito y la parte reembolsable se limita al ${C.pct_reembolsable}% de lo que ganes por encima de ${usd(C.umbral_ingreso_ganado)}.` },
        { p: `¿Cuándo deja de darse el crédito por ${k} ${ud}?`, r: `Empieza a bajar al pasar de ${usd(C.umbral_reduccion.single)} (${usd(C.umbral_reduccion.mfj)} en conjunta) y se pierde entero hacia ${usd(finSingle)} (${usd(finMfj)}).` },
      ],
      enlaces: filas.filter((f) => f !== fila).map((f) => ({ fila: f, texto: `Crédito por ${f.hijos} ${+f.hijos === 1 ? 'hijo' : 'hijos'}` })),
    };
  },
};
