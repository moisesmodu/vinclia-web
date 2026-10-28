// Plantillas de páginas programáticas. Cada una recibe una fila de CSV y devuelve el contenido de la página,
// siempre con datos calculados que cambian de fila a fila (nada de texto repetido con otra cifra).
import { tt, type Lang, type T, type Tabla } from '../lib/def';
import type { Bloques } from '../lib/params';
import { sueldoNeto } from '../lib/calc/laboral';
import { cotizacion } from '../lib/calc/ss';
import { cuotaAnual, baseTrabajo, retencion } from '../lib/calc/irpf';
import { sumarEscalas, r2 } from '../lib/calc/base';
import paisES from '../../params/es/pais.json';
import { PLANTILLAS_US } from './us';

export interface PaginaProg {
  titulo: string;
  h1: string;
  descripcion: string;
  intro: string; // HTML
  tablas: Tabla[];
  calc: string;
  query: Record<string, string | number>;
  enlaces?: { fila: Record<string, string>; texto: string }[];
}
type Ctx = { P: Bloques; lang: Lang; anio: number; filas: Record<string, string>[] };
type Plantilla = (fila: Record<string, string>, ctx: Ctx) => PaginaProg;

const COM = Object.keys(paisES.comunidades);
const nom = (c: string, l: Lang) => (paisES.comunidades as any)[c][l];
const eur = (n: number, l: Lang, dec = 0) => new Intl.NumberFormat(l === 'es' ? 'es-ES' : 'ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n);
const num = (n: number, l: Lang) => new Intl.NumberFormat(l === 'es' ? 'es-ES' : 'ca-ES').format(n);
const L = (l: Lang, es: string, ca: string) => (l === 'es' ? es : ca);
const vecinos = (filas: Record<string, string>[], fila: Record<string, string>, k = 2) => {
  const i = filas.indexOf(fila);
  return [...filas.slice(Math.max(0, i - k), i), ...filas.slice(i + 1, i + 1 + k)];
};

export const PLANTILLAS: Record<string, Plantilla> = {
  'neto-por-bruto'(fila, { P, lang, anio, filas }) {
    const b = Number(fila.bruto);
    const a14 = sueldoNeto({ brutoAnual: b, pagas: 14, ccaa: 'MD' }, P);
    const a12 = sueldoNeto({ brutoAnual: b, pagas: 12 }, P);
    const porCom = COM.map((c) => { const r = sueldoNeto({ brutoAnual: b, pagas: 14, ccaa: c }, P); return { c, cuota: r.renta!.cuota, dif: r.renta!.diferencia, real: r2(b - r.ss.trabajador.anual - r.renta!.cuota) }; }).sort((x, y) => y.real - x.real);
    const mejor = porCom[0], peor = porCom[porCom.length - 1];
    const ss = a14.ss.trabajador.anual;
    const hijos = [0, 1, 2, 3].map((h) => retencion({ brutoAnual: b, ssAnual: ss, hijos: h }, P.fiscal).tipo);
    return {
      titulo: L(lang, `${num(b, lang)} € brutos al año: cuánto es en neto (${anio})`, `${num(b, lang)} € bruts l’any: quant és en net (${anio})`),
      h1: L(lang, `Sueldo neto de ${num(b, lang)} € brutos en ${anio}`, `Sou net de ${num(b, lang)} € bruts el ${anio}`),
      descripcion: L(lang, `Con ${num(b, lang)} € brutos cobras ${eur(a14.netoOrdinaria, lang)} netos al mes en 14 pagas o ${eur(a12.netoOrdinaria, lang)} en 12. Retención del ${a14.ret.tipo} % y IRPF real por comunidad.`, `Amb ${num(b, lang)} € bruts cobres ${eur(a14.netoOrdinaria, lang)} nets al mes en 14 pagues o ${eur(a12.netoOrdinaria, lang)} en 12. Retenció del ${a14.ret.tipo} % i IRPF real per comunitat.`),
      intro: L(lang,
        `<p>Un salario de <strong>${num(b, lang)} € brutos anuales</strong> deja <strong>${eur(a14.netoOrdinaria, lang, 2)} netos en cada una de las 14 pagas</strong> (${eur(a14.netoExtra, lang, 2)} en las pagas extra) o ${eur(a12.netoOrdinaria, lang, 2)} si cobras en 12. La empresa te retiene un ${a14.ret.tipo} % de IRPF y ${eur(a14.ss.trabajador.mensual, lang, 2)} al mes de Seguridad Social. A la empresa le cuesta ${eur(a14.costeEmpresa, lang)} al año.</p><p>La retención es igual en toda España, pero el IRPF final no: con este sueldo, donde más neto queda es ${nom(mejor.c, lang)} (${eur(mejor.real, lang)} al año) y donde menos, ${nom(peor.c, lang)} (${eur(peor.real, lang)}).</p>`,
        `<p>Un salari de <strong>${num(b, lang)} € bruts anuals</strong> deixa <strong>${eur(a14.netoOrdinaria, lang, 2)} nets a cadascuna de les 14 pagues</strong> (${eur(a14.netoExtra, lang, 2)} a les pagues extra) o ${eur(a12.netoOrdinaria, lang, 2)} si cobres en 12. L’empresa et reté un ${a14.ret.tipo} % d’IRPF i ${eur(a14.ss.trabajador.mensual, lang, 2)} al mes de Seguretat Social. A l’empresa li costa ${eur(a14.costeEmpresa, lang)} l’any.</p><p>La retenció és igual a tot Espanya, però l’IRPF final no: amb aquest sou, on queda més net és ${nom(mejor.c, lang)} (${eur(mejor.real, lang)} l’any) i on menys, ${nom(peor.c, lang)} (${eur(peor.real, lang)}).</p>`),
      tablas: [
        { titulo: tt('Desglose de la nómina', 'Desglossament de la nòmina'), cab: [tt('Concepto', 'Concepte'), tt('14 pagas', '14 pagues'), tt('12 pagas', '12 pagues')], formatos: ['txt', 'eur', 'eur'], filas: [
          [tt('Bruto de cada paga', 'Brut de cada paga'), a14.brutoPaga, a12.brutoPaga],
          [tt('Seguridad Social', 'Seguretat Social'), a14.ss.trabajador.mensual, a12.ss.trabajador.mensual],
          [tt('IRPF de cada paga', 'IRPF de cada paga'), a14.irpfPaga, a12.irpfPaga],
          [tt('Neto nómina ordinaria', 'Net nòmina ordinària'), a14.netoOrdinaria, a12.netoOrdinaria],
          [tt('Neto paga extra', 'Net paga extra'), a14.netoExtra, '—'],
          [tt('Neto anual', 'Net anual'), a14.netoAnual, a12.netoAnual],
        ] },
        { titulo: tt('IRPF real por comunidad (en la renta)', 'IRPF real per comunitat (a la renda)'), cab: [tt('Comunidad', 'Comunitat'), tt('IRPF anual', 'IRPF anual'), tt('Diferencia con la retención', 'Diferència amb la retenció'), tt('Neto real anual', 'Net real anual')], formatos: ['txt', 'eur', 'eur', 'eur'],
          filas: porCom.map((x) => [nom(x.c, lang), x.cuota, x.dif, x.real]) },
        { titulo: tt('Retención según hijos (computados al 50 %)', 'Retenció segons fills (computats al 50 %)'), cab: [tt('Hijos', 'Fills'), tt('Retención', 'Retenció')], formatos: ['txt', 'pct'], filas: hijos.map((t, h) => [String(h), t]) },
      ],
      calc: 'sueldo-neto',
      query: { bruto: b },
      enlaces: vecinos(filas, fila).map((f) => ({ fila: f, texto: L(lang, `${num(+f.bruto, lang)} € brutos`, `${num(+f.bruto, lang)} € bruts`) })),
    };
  },

  'neto-por-comunidad'(fila, { P, lang, anio, filas }) {
    const c = fila.ccaa;
    const brutos = [18000, 20000, 22000, 25000, 28000, 30000, 35000, 40000, 45000, 50000, 60000, 80000];
    const esc = P.fiscal.irpf.escalas_autonomicas[c];
    const filasT = brutos.map((b) => { const r = sueldoNeto({ brutoAnual: b, pagas: 14, ccaa: c }, P); const real = b - r.ss.trabajador.anual - r.renta!.cuota; return [b, r.netoOrdinaria, r.renta!.cuota, r.renta!.diferencia, r2(real / 14)]; });
    const r30 = sueldoNeto({ brutoAnual: 30000, pagas: 14, ccaa: c }, P);
    const media30 = COM.reduce((s, x) => s + sueldoNeto({ brutoAnual: 30000, pagas: 14, ccaa: x }, P).renta!.cuota, 0) / COM.length;
    const dif = r30.renta!.cuota - media30;
    let d = 0;
    return {
      titulo: L(lang, `Sueldo neto en ${nom(c, 'es')} ${anio}: tabla e IRPF autonómico`, `Sou net a ${nom(c, 'ca')} ${anio}: taula i IRPF autonòmic`),
      h1: L(lang, `Sueldo neto en ${nom(c, 'es')} (${anio})`, `Sou net a ${nom(c, 'ca')} (${anio})`),
      descripcion: L(lang, `Tabla de bruto a neto en ${nom(c, 'es')}: retención en nómina, IRPF real con la escala autonómica (del ${esc.escala[0].tipo} al ${esc.escala[esc.escala.length - 1].tipo} %) y lo que sale en la renta.`, `Taula de brut a net a ${nom(c, 'ca')}: retenció a la nòmina, IRPF real amb l’escala autonòmica (del ${esc.escala[0].tipo} al ${esc.escala[esc.escala.length - 1].tipo} %) i el que surt a la renda.`),
      intro: L(lang,
        `<p>En ${nom(c, 'es')} la parte autonómica del IRPF va del <strong>${esc.escala[0].tipo} %</strong> al <strong>${esc.escala[esc.escala.length - 1].tipo} %</strong> en ${esc.escala.length} tramos${esc.minimo_personal && esc.minimo_personal !== P.fiscal.irpf.minimos.personal ? `, con un mínimo personal propio de ${eur(esc.minimo_personal, lang)}` : ''}${esc.bonificacion_cuota_pct ? `, y la cuota tiene una bonificación del ${esc.bonificacion_cuota_pct} %` : ''}. Con 30.000 € brutos se pagan ${eur(r30.renta!.cuota, lang)} de IRPF al año, ${eur(Math.abs(dif), lang)} ${dif >= 0 ? 'más' : 'menos'} que la media de las comunidades de régimen común.</p><p>La nómina retiene lo mismo que en el resto de España; la diferencia se regulariza en la declaración de la renta.</p>`,
        `<p>A ${nom(c, 'ca')} la part autonòmica de l’IRPF va del <strong>${esc.escala[0].tipo} %</strong> al <strong>${esc.escala[esc.escala.length - 1].tipo} %</strong> en ${esc.escala.length} trams${esc.minimo_personal && esc.minimo_personal !== P.fiscal.irpf.minimos.personal ? `, amb un mínim personal propi de ${eur(esc.minimo_personal, lang)}` : ''}${esc.bonificacion_cuota_pct ? `, i la quota té una bonificació del ${esc.bonificacion_cuota_pct} %` : ''}. Amb 30.000 € bruts es paguen ${eur(r30.renta!.cuota, lang)} d’IRPF l’any, ${eur(Math.abs(dif), lang)} ${dif >= 0 ? 'més' : 'menys'} que la mitjana de les comunitats de règim comú.</p><p>La nòmina reté el mateix que a la resta d’Espanya; la diferència es regularitza a la declaració de la renda.</p>`),
      tablas: [
        { titulo: tt('Bruto a neto (14 pagas, soltero sin hijos)', 'Brut a net (14 pagues, solter sense fills)'), cab: [tt('Bruto anual', 'Brut anual'), tt('Neto en nómina', 'Net en nòmina'), tt('IRPF real anual', 'IRPF real anual'), tt('A pagar (+) o devolver (−) en la renta', 'A pagar (+) o retornar (−) a la renda'), tt('Neto real por paga', 'Net real per paga')], formatos: ['eur0', 'eur', 'eur', 'eur', 'eur'], filas: filasT },
        { titulo: tt('Escala autonómica', 'Escala autonòmica'), cab: [tt('Base liquidable (€)', 'Base liquidable (€)'), tt('Tipo autonómico', 'Tipus autonòmic')], formatos: ['txt', 'pct'], filas: esc.escala.map((t: any) => { const f = [`${num(d, lang)} – ${t.hasta == null ? '∞' : num(t.hasta, lang)}`, t.tipo]; d = t.hasta ?? d; return f; }) },
      ],
      calc: 'sueldo-neto',
      query: { ccaa: c },
      enlaces: filas.filter((f) => f !== fila).map((f) => ({ fila: f, texto: nom(f.ccaa, lang) })),
    };
  },

  'irpf-por-comunidad'(fila, { P, lang, anio, filas }) {
    const c = fila.ccaa;
    const esc = P.fiscal.irpf.escalas_autonomicas[c];
    const comb = sumarEscalas(P.fiscal.irpf.escala_estatal, esc.escala);
    const bases = [12000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000, 150000];
    const filasT = bases.map((bg) => { const r = cuotaAnual({ baseGeneral: bg, ccaa: c }, P.fiscal); return [bg, r.estatal, r.autonomica, r.total, r.tipoMedio, r.tipoMarginal]; });
    const r40 = cuotaAnual({ baseGeneral: 40000, ccaa: c }, P.fiscal).total;
    const rank = COM.map((x) => ({ x, t: cuotaAnual({ baseGeneral: 40000, ccaa: x }, P.fiscal).total })).sort((a, b) => a.t - b.t);
    const pos = rank.findIndex((y) => y.x === c) + 1;
    let d = 0;
    return {
      titulo: L(lang, `IRPF en ${nom(c, 'es')} ${anio}: tramos y cuánto se paga`, `IRPF a ${nom(c, 'ca')} ${anio}: trams i quant es paga`),
      h1: L(lang, `IRPF en ${nom(c, 'es')} (${anio})`, `IRPF a ${nom(c, 'ca')} (${anio})`),
      descripcion: L(lang, `Tramos del IRPF en ${nom(c, 'es')} (estatal + autonómico), tipo marginal y cuota según la base liquidable. Puesto ${pos} de ${COM.length} en IRPF con 40.000 € de base.`, `Trams de l’IRPF a ${nom(c, 'ca')} (estatal + autonòmic), tipus marginal i quota segons la base liquidable. Posició ${pos} de ${COM.length} en IRPF amb 40.000 € de base.`),
      intro: L(lang,
        `<p>En ${nom(c, 'es')} el tipo total del IRPF (estatal más autonómico) va del <strong>${comb[0].tipo} %</strong> al <strong>${comb[comb.length - 1].tipo} %</strong>. Con una base liquidable de 40.000 € se pagan ${eur(r40, lang)} al año: es la ${pos}.ª comunidad más barata de ${COM.length} (la más barata es ${nom(rank[0].x, 'es')} y la más cara, ${nom(rank[rank.length - 1].x, 'es')}).</p>`,
        `<p>A ${nom(c, 'ca')} el tipus total de l’IRPF (estatal més autonòmic) va del <strong>${comb[0].tipo} %</strong> al <strong>${comb[comb.length - 1].tipo} %</strong>. Amb una base liquidable de 40.000 € es paguen ${eur(r40, lang)} l’any: és la ${pos}a comunitat més barata de ${COM.length} (la més barata és ${nom(rank[0].x, 'ca')} i la més cara, ${nom(rank[rank.length - 1].x, 'ca')}).</p>`),
      tablas: [
        { titulo: tt('Escala combinada', 'Escala combinada'), cab: [tt('Base liquidable (€)', 'Base liquidable (€)'), tt('Tipo total', 'Tipus total')], formatos: ['txt', 'pct'], filas: comb.map((t) => { const f = [`${num(d, lang)} – ${t.hasta == null ? '∞' : num(t.hasta, lang)}`, t.tipo]; d = t.hasta ?? d; return f; }) },
        { titulo: tt('Cuota según la base liquidable (sin deducciones)', 'Quota segons la base liquidable (sense deduccions)'), cab: [tt('Base', 'Base'), tt('Estatal', 'Estatal'), tt('Autonómica', 'Autonòmica'), tt('Total', 'Total'), tt('Tipo medio', 'Tipus mitjà'), tt('Marginal', 'Marginal')], formatos: ['eur0', 'eur', 'eur', 'eur', 'pct', 'pct'], filas: filasT },
      ],
      calc: 'irpf-renta',
      query: { ccaa: c },
      enlaces: filas.filter((f) => f !== fila).map((f) => ({ fila: f, texto: nom(f.ccaa, lang) })),
    };
  },

  'irpf-por-salario'(fila, { P, lang, anio, filas }) {
    const b = Number(fila.bruto);
    const ss = cotizacion({ brutoAnual: b }, P.laboral).trabajador.anual;
    const bt = baseTrabajo(b, ss, P.fiscal);
    const ret = retencion({ brutoAnual: b, ssAnual: ss }, P.fiscal);
    const filasC = COM.map((c) => { const r = cuotaAnual({ baseGeneral: bt.base, ccaa: c, rendimientosTrabajoIntegros: b }, P.fiscal); return { c, r }; }).sort((x, y) => x.r.total - y.r.total);
    const min = filasC[0], max = filasC[filasC.length - 1];
    return {
      titulo: L(lang, `IRPF de ${num(b, lang)} € brutos en ${anio} por comunidad`, `IRPF de ${num(b, lang)} € bruts el ${anio} per comunitat`),
      h1: L(lang, `Cuánto IRPF se paga con ${num(b, lang)} € brutos`, `Quant IRPF es paga amb ${num(b, lang)} € bruts`),
      descripcion: L(lang, `Con ${num(b, lang)} € brutos el IRPF anual va de ${eur(min.r.total, lang)} en ${nom(min.c, 'es')} a ${eur(max.r.total, lang)} en ${nom(max.c, 'es')}. Retención del ${ret.tipo} % y tipo marginal por comunidad.`, `Amb ${num(b, lang)} € bruts l’IRPF anual va de ${eur(min.r.total, lang)} a ${nom(min.c, 'ca')} a ${eur(max.r.total, lang)} a ${nom(max.c, 'ca')}. Retenció del ${ret.tipo} % i tipus marginal per comunitat.`),
      intro: L(lang,
        `<p>Un asalariado soltero sin hijos que gana <strong>${num(b, lang)} € brutos</strong> tiene una base liquidable de ${eur(bt.base, lang)} después de restar ${eur(ss, lang)} de Seguridad Social, 2.000 € de gastos${bt.reduccion ? ` y ${eur(bt.reduccion, lang)} de reducción por rendimientos del trabajo` : ''}. Su retención en nómina es del ${ret.tipo} % (${eur(ret.importe, lang)} al año), igual en toda España.</p><p>El IRPF real depende de dónde vive: la diferencia entre la comunidad más barata y la más cara es de ${eur(max.r.total - min.r.total, lang)} al año.</p>`,
        `<p>Un assalariat solter sense fills que guanya <strong>${num(b, lang)} € bruts</strong> té una base liquidable de ${eur(bt.base, lang)} després de restar ${eur(ss, lang)} de Seguretat Social, 2.000 € de despeses${bt.reduccion ? ` i ${eur(bt.reduccion, lang)} de reducció per rendiments del treball` : ''}. La seva retenció a la nòmina és del ${ret.tipo} % (${eur(ret.importe, lang)} l’any), igual a tot Espanya.</p><p>L’IRPF real depèn d’on viu: la diferència entre la comunitat més barata i la més cara és de ${eur(max.r.total - min.r.total, lang)} l’any.</p>`),
      tablas: [{ titulo: tt('IRPF anual por comunidad', 'IRPF anual per comunitat'), cab: [tt('Comunidad', 'Comunitat'), tt('IRPF anual', 'IRPF anual'), tt('Tipo medio', 'Tipus mitjà'), tt('Tipo marginal', 'Tipus marginal'), tt('Renta: pagar (+) / devolver (−)', 'Renda: pagar (+) / retornar (−)')], formatos: ['txt', 'eur', 'pct', 'pct', 'eur'],
        filas: filasC.map(({ c, r }) => [nom(c, lang), r.total, r.tipoMedio, r.tipoMarginal, r2(r.total - ret.importe)]) }],
      calc: 'irpf-renta',
      query: { trabajo: b },
      enlaces: vecinos(filas, fila).map((f) => ({ fila: f, texto: L(lang, `${num(+f.bruto, lang)} € brutos`, `${num(+f.bruto, lang)} € bruts`) })),
    };
  },
};

// Plantillas del sitio de EE. UU. (src/plantillas/us.ts)
Object.assign(PLANTILLAS, PLANTILLAS_US);

export type { T };
