// Páginas por combinación de ImpuestoClaro: cuota de autónomos por tramo, modelos 303 y 130 por trimestre con
// sus fechas, e IVA de productos y servicios de uso diario con su artículo de la Ley 37/1992 y ejemplos propios.
import { tt, type Tabla } from '../lib/def';
import type { Plantilla } from './index';
import { cuotaAutonomos, netoAutonomo } from '../lib/calc/laboral';
import { modelo303, modelo130, recargoExtemporaneo } from '../lib/calc/fiscal';
import { sumarDias } from '../lib/calc/base';
import { eur, num, pc, L, vecinos, r2 } from './util';

const LEY_IVA = 'https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740';
const MESES = { es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'], ca: ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'] };
const DIAS = { es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], ca: ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'] };
/** «20 de abril de 2027» / «20 d’abril de 2027». */
const fechaLarga = (iso: string, l: 'es' | 'ca') => {
  const [y, m, d] = iso.split('-').map(Number);
  const mes = MESES[l][m - 1];
  return `${d} ${l === 'ca' && /^[aeiou]/.test(mes) ? 'd’' : 'de '}${mes} de ${y}`;
};
const diaSemana = (iso: string, l: 'es' | 'ca') => DIAS[l][new Date(iso + 'T00:00:00Z').getUTCDay()];
/** Si el plazo acaba en sábado o domingo pasa al lunes (art. 48 Ley 39/2015). Los festivos nacionales de esos días no caen en fin de plazo. */
const habil = (iso: string) => { let d = iso; while ([0, 6].includes(new Date(d + 'T00:00:00Z').getUTCDay())) d = sumarDias(d, 1); return d; };
const pad = (n: number) => String(n).padStart(2, '0');
/** Plazo del trimestre t del año a: del 1 al 20 del mes siguiente (el 4T, hasta el 30 de enero). */
function plazo(t: number, a: number) {
  const ini = t === 4 ? `${a + 1}-01-01` : `${a}-${pad(t * 3 + 1)}-01`;
  const finTeorico = t === 4 ? `${a + 1}-01-30` : `${a}-${pad(t * 3 + 1)}-20`;
  const fin = habil(finTeorico);
  return { ini, finTeorico, fin, domiciliacion: sumarDias(fin, -5), movido: fin !== finTeorico };
}

// Un mismo autónomo de ejemplo durante todo el año: así cada trimestre enseña su propio caso (compensaciones,
// pagos acumulados, la devolución del 4T) y las cuatro páginas cuentan una historia coherente.
const EJ = [
  { ventas: 8000, soportado: 700, ingresos: 8000, gastos: 2600 },
  { ventas: 4500, soportado: 1900, ingresos: 4500, gastos: 3900 }, // compra de un ordenador: el IVA sale a compensar
  { ventas: 9000, soportado: 650, ingresos: 9000, gastos: 2500 },
  { ventas: 11000, soportado: 900, ingresos: 11000, gastos: 2900 },
];
function serie303() {
  let comp = 0;
  return EJ.map((q, i) => {
    const r = modelo303({ ventas: [{ base: q.ventas, tipo: 21 }], soportado: q.soportado, compensar: comp, trimestre: i + 1 });
    const out = { ...q, t: i + 1, compensarEntrada: comp, r };
    comp = i < 3 ? r.aCompensar : 0;
    return out;
  });
}
function serie130(F: any) {
  let ing = 0, gas = 0, pagado = 0;
  return EJ.map((q, i) => {
    ing += q.ingresos; gas += q.gastos;
    const r = modelo130({ ingresosAcum: ing, gastosAcum: gas, retencionesAcum: 0, pagosAnteriores: pagado, trimestre: i + 1, rendAnterior: 20000 }, F);
    const out = { t: i + 1, ing, gas, pagadoAntes: pagado, r };
    pagado += r.aIngresar;
    return out;
  });
}
const nomT = (t: number, l: 'es' | 'ca') => [L(l, 'primer', 'primer'), L(l, 'segundo', 'segon'), L(l, 'tercer', 'tercer'), L(l, 'cuarto', 'quart')][t - 1];

export const PLANTILLAS_IMPUESTOS: Record<string, Plantilla> = {
  'autonomos-tramo'(fila, { P, lang, anio, filas }) {
    const n = Number(fila.tramo);
    const A = P.laboral.autonomos;
    const T = A.tramos[n - 1], ant = A.tramos[n - 2], sig = A.tramos[n];
    const tipo = A.tipo_total_pct, g = A.deduccion_gastos_genericos_pct;
    const cMin = r2(T.base_min * tipo / 100), cMax = r2(T.base_max * tipo / 100);
    // Rendimiento (ingresos − gastos) anual que cae en el tramo: el computable es el 93 % (7 % de gastos genéricos)
    const aRend = (m: number) => Math.round(m * 12 / (1 - g / 100));
    const rIni = aRend(T.rend_min), rFin = T.rend_max == null ? null : aRend(T.rend_max);
    const ejemplos = (rFin == null ? [rIni + 6000, rIni + 20000, rIni + 50000] : [rIni + 300, Math.round((rIni + rFin) / 2), rFin - 300]).map((x) => Math.max(600, x));
    const filasEj = ejemplos.map((x) => { const r = netoAutonomo({ ingresos: x, gastos: 0, ccaa: 'MD' }, P); return { x, r }; });
    const medio = filasEj[1];
    const reducida = T.tabla === 'reducida';
    const vsAnt = ant ? r2(cMin - ant.base_min * tipo / 100) : 0;
    const errorSig = sig ? r2((sig.base_min - T.base_min) * tipo / 100 * 12) : 0;
    const rango = (l: 'es' | 'ca') => (T.rend_max == null ? L(l, `de más de ${eur(T.rend_min - 0.01, l)} al mes`, `de més de ${eur(T.rend_min - 0.01, l)} al mes`) : n === 1 ? L(l, `de hasta ${eur(T.rend_max, l)} al mes`, `de fins a ${eur(T.rend_max, l)} al mes`) : L(l, `de ${eur(T.rend_min, l, 2)} a ${eur(T.rend_max, l)} al mes`, `de ${eur(T.rend_min, l, 2)} a ${eur(T.rend_max, l)} al mes`));
    const rangoAnual = (l: 'es' | 'ca') => (rFin == null ? L(l, `más de ${eur(rIni, l)} al año`, `més de ${eur(rIni, l)} l’any`) : n === 1 ? L(l, `hasta ${eur(rFin, l)} al año`, `fins a ${eur(rFin, l)} l’any`) : L(l, `entre ${eur(rIni, l)} y ${eur(rFin, l)} al año`, `entre ${eur(rIni, l)} i ${eur(rFin, l)} l’any`));
    const tablas: Tabla[] = [
      { titulo: tt(`Tramo ${n} en ${anio}`, `Tram ${n} el ${anio}`), cab: [tt('Concepto', 'Concepte'), tt('Al mes', 'Al mes'), tt('Al año', 'L’any')], formatos: ['txt', 'eur', 'eur'], filas: [
        [tt('Rendimiento neto computable desde', 'Rendiment net computable des de'), T.rend_min, r2(T.rend_min * 12)],
        [tt('Rendimiento neto computable hasta', 'Rendiment net computable fins a'), T.rend_max ?? '—', T.rend_max == null ? '—' : r2(T.rend_max * 12)],
        [tt('Base mínima', 'Base mínima'), T.base_min, r2(T.base_min * 12)],
        [tt('Base máxima', 'Base màxima'), T.base_max, r2(T.base_max * 12)],
        [tt(`Cuota mínima (${String(tipo).replace('.', ',')} %)`, `Quota mínima (${String(tipo).replace('.', ',')} %)`), cMin, r2(cMin * 12)],
        [tt('Cuota máxima', 'Quota màxima'), cMax, r2(cMax * 12)],
      ] },
      { titulo: tt('Tres casos dentro del tramo (Madrid, sin gastos, soltero)', 'Tres casos dins del tram (Madrid, sense despeses, solter)'), cab: [tt('Ingresos menos gastos al año', 'Ingressos menys despeses l’any'), tt('Cuota al mes', 'Quota al mes'), tt('IRPF del año', 'IRPF de l’any'), tt('Neto al mes', 'Net al mes')], formatos: ['eur0', 'eur', 'eur0', 'eur'],
        filas: filasEj.map(({ x, r }) => [x, r.cuota.cuota, r.irpf.total, r.netoMensual]) },
      { titulo: tt('Los 15 tramos: cuota mínima al mes', 'Els 15 trams: quota mínima al mes'), cab: [tt('Tramo', 'Tram'), tt('Rendimiento al mes', 'Rendiment al mes'), tt('Cuota mínima', 'Quota mínima')], formatos: ['num0', 'txt', 'eur'],
        filas: A.tramos.map((x: any, i: number) => [i + 1, x.rend_max == null ? `> ${num(x.rend_min - 0.01, lang)} €` : `${num(x.rend_min, lang)} – ${num(x.rend_max, lang)} €`, r2(x.base_min * tipo / 100)]) },
    ];
    return {
      titulo: L(lang, `Tramo ${n} de autónomos ${anio}: cuota de ${eur(cMin, lang, 2)} al mes`, `Tram ${n} d’autònoms ${anio}: quota de ${eur(cMin, lang, 2)} al mes`),
      h1: L(lang, `Cuota de autónomos del tramo ${n} (${anio})`, `Quota d’autònoms del tram ${n} (${anio})`),
      descripcion: L(lang, `Tramo ${n}: rendimiento neto ${rango(lang)}. Cuota mínima de ${eur(cMin, lang, 2)} y máxima de ${eur(cMax, lang, 2)} al mes. Cuánto hay que facturar y casos con IRPF.`, `Tram ${n}: rendiment net ${rango(lang)}. Quota mínima de ${eur(cMin, lang, 2)} i màxima de ${eur(cMax, lang, 2)} al mes. Quant cal facturar i casos amb IRPF.`),
      intro: L(lang,
        `<p>Estás en el <strong>tramo ${n}</strong> de la ${reducida ? 'tabla reducida' : 'tabla general'} si tu rendimiento neto computable es <strong>${rango(lang)}</strong>. Como al rendimiento (ingresos menos gastos) se le resta un ${g} % de gastos genéricos, eso equivale a ganar ${rangoAnual(lang)} antes de pagar la cuota. Pagas como mínimo <strong>${eur(cMin, lang, 2)} al mes</strong> (${eur(cMin * 12, lang)} al año) por una base de ${eur(T.base_min, lang, 2)}, y puedes subir la base hasta ${eur(T.base_max, lang, 2)}, con una cuota de ${eur(cMax, lang, 2)}.</p><p>${ant ? `Son ${eur(Math.abs(vsAnt), lang, 2)} al mes ${vsAnt >= 0 ? 'más' : 'menos'} que en el tramo ${n - 1}. ` : ''}Con ${eur(medio.x, lang)} de rendimiento al año, en Madrid te quedarían ${eur(medio.r.netoMensual, lang, 2)} netos al mes después de la cuota y del IRPF (${eur(medio.r.irpf.total, lang)}). ${sig ? `Si al regularizar tu rendimiento real cae en el tramo ${n + 1}, la Seguridad Social te reclamará unos ${eur(errorSig, lang)} por el año.` : 'Es el último tramo: a partir de aquí la cuota mínima no sube más.'}</p>`,
        `<p>Ets al <strong>tram ${n}</strong> de la ${reducida ? 'taula reduïda' : 'taula general'} si el teu rendiment net computable és <strong>${rango(lang)}</strong>. Com que al rendiment (ingressos menys despeses) se li resta un ${g} % de despeses genèriques, això equival a guanyar ${rangoAnual(lang)} abans de pagar la quota. Pagues com a mínim <strong>${eur(cMin, lang, 2)} al mes</strong> (${eur(cMin * 12, lang)} l’any) per una base de ${eur(T.base_min, lang, 2)}, i pots pujar la base fins a ${eur(T.base_max, lang, 2)}, amb una quota de ${eur(cMax, lang, 2)}.</p><p>${ant ? `Són ${eur(Math.abs(vsAnt), lang, 2)} al mes ${vsAnt >= 0 ? 'més' : 'menys'} que al tram ${n - 1}. ` : ''}Amb ${eur(medio.x, lang)} de rendiment l’any, a Madrid et quedarien ${eur(medio.r.netoMensual, lang, 2)} nets al mes després de la quota i de l’IRPF (${eur(medio.r.irpf.total, lang)}). ${sig ? `Si en regularitzar el teu rendiment real cau al tram ${n + 1}, la Seguretat Social et reclamarà uns ${eur(errorSig, lang)} per l’any.` : 'És l’últim tram: a partir d’aquí la quota mínima ja no puja.'}</p>`),
      tablas,
      calc: 'sueldo-neto-autonomo',
      query: { ingresos: medio.x, gastos: 0 },
      cifra: { e: L(lang, `Cuota mínima del tramo ${n}`, `Quota mínima del tram ${n}`), v: cMin, f: 'eur', nota: L(lang, `Al mes, con rendimientos ${rango(lang)}`, `Al mes, amb rendiments ${rango(lang)}`),
        extra: [{ e: L(lang, 'Al año', 'L’any'), v: r2(cMin * 12), f: 'eur0' }, { e: L(lang, 'Cuota máxima', 'Quota màxima'), v: cMax, f: 'eur' }, { e: L(lang, 'Tarifa plana', 'Tarifa plana'), v: A.tarifa_plana_euros, f: 'eur0' }] },
      grafico: { tipo: 'barras', titulo: L(lang, 'Cuota mínima al mes en cada tramo', 'Quota mínima al mes a cada tram'), formato: 'eur0',
        desc: L(lang, `De ${eur(A.tramos[0].base_min * tipo / 100, lang)} en el tramo 1 a ${eur(A.tramos[14].base_min * tipo / 100, lang)} en el 15. Tramo ${n}: ${eur(cMin, lang, 2)}.`, `De ${eur(A.tramos[0].base_min * tipo / 100, lang)} al tram 1 a ${eur(A.tramos[14].base_min * tipo / 100, lang)} al 15. Tram ${n}: ${eur(cMin, lang, 2)}.`),
        filas: A.tramos.map((x: any, i: number) => ({ e: L(lang, `Tramo ${i + 1}`, `Tram ${i + 1}`), v: r2(x.base_min * tipo / 100), act: i + 1 === n })) },
      faq: [
        { p: L(lang, `¿Cuánto pago de autónomos si gano ${eur(medio.x / 12, lang)} al mes?`, `Quant pago d’autònoms si guanyo ${eur(medio.x / 12, lang)} al mes?`),
          r: L(lang, `Con ${eur(medio.x, lang)} al año de ingresos menos gastos, el rendimiento computable es de ${eur(medio.r.cuota.computableMensual, lang, 2)} al mes: tramo ${medio.r.cuota.tramo}, cuota mínima de ${eur(medio.r.cuota.cuotaMin, lang, 2)} al mes.`, `Amb ${eur(medio.x, lang)} l’any d’ingressos menys despeses, el rendiment computable és de ${eur(medio.r.cuota.computableMensual, lang, 2)} al mes: tram ${medio.r.cuota.tramo}, quota mínima de ${eur(medio.r.cuota.cuotaMin, lang, 2)} al mes.`) },
        { p: L(lang, `¿Cuánto tengo que ganar para estar en el tramo ${n}?`, `Quant he de guanyar per ser al tram ${n}?`),
          r: L(lang, `Un rendimiento (ingresos menos gastos deducibles) ${rangoAnual(lang)}, que tras restar el ${g} % de gastos genéricos da un rendimiento computable ${rango(lang)}.`, `Un rendiment (ingressos menys despeses deduïbles) ${rangoAnual(lang)}, que després de restar el ${g} % de despeses genèriques dona un rendiment computable ${rango(lang)}.`) },
        { p: L(lang, `¿Y si el primer año tengo tarifa plana?`, `I si el primer any tinc tarifa plana?`),
          r: L(lang, `Pagas ${eur(A.tarifa_plana_euros, lang)} al mes durante ${A.tarifa_plana_meses} meses en lugar de ${eur(cMin, lang, 2)}: te ahorras ${eur(Math.max(0, (cMin - A.tarifa_plana_euros) * A.tarifa_plana_meses), lang)} el primer año.`, `Pagues ${eur(A.tarifa_plana_euros, lang)} al mes durant ${A.tarifa_plana_meses} mesos en lloc de ${eur(cMin, lang, 2)}: t’estalvies ${eur(Math.max(0, (cMin - A.tarifa_plana_euros) * A.tarifa_plana_meses), lang)} el primer any.`) },
      ],
      enlaces: vecinos(filas, fila, 3).map((f) => ({ fila: f, texto: L(lang, `Tramo ${f.tramo}`, `Tram ${f.tramo}`) })),
    };
  },

  'modelo-303-trimestre'(fila, { P, lang, anio, filas }) {
    const t = Number(fila.t);
    const pl = plazo(t, anio);
    const s = serie303();
    const q = s[t - 1];
    const res = q.r;
    const nt = nomT(t, lang);
    const rec = recargoExtemporaneo({ cuota: Math.max(res.aIngresar, 1000), finPlazo: pl.fin, presentacion: sumarDias(pl.fin, 45), reduccion: false }, P.fiscal);
    const resultadoTxt = (l: 'es' | 'ca') => res.aIngresar > 0 ? L(l, `sale a ingresar ${eur(res.aIngresar, l, 2)}`, `surt a ingressar ${eur(res.aIngresar, l, 2)}`) : t === 4 ? L(l, `sale a devolver ${eur(res.aCompensar, l, 2)}`, `surt a retornar ${eur(res.aCompensar, l, 2)}`) : L(l, `sale negativo: ${eur(res.aCompensar, l, 2)} a compensar en el ${nomT(t + 1, l)} trimestre`, `surt negatiu: ${eur(res.aCompensar, l, 2)} a compensar al ${nomT(t + 1, l)} trimestre`);
    const extra4T = t === 4 ? L(lang, ` Con el del cuarto trimestre se presenta también el resumen anual, el modelo 390, en el mismo plazo. Es el único trimestre en el que se puede pedir la devolución.`, ` Amb el del quart trimestre es presenta també el resum anual, el model 390, en el mateix termini. És l’únic trimestre en què es pot demanar la devolució.`) : '';
    const movido = pl.movido ? L(lang, ` El ${fechaLarga(pl.finTeorico, lang)} cae en ${diaSemana(pl.finTeorico, lang)}, así que el plazo se alarga al ${diaSemana(pl.fin, lang)} siguiente.`, ` El ${fechaLarga(pl.finTeorico, lang)} cau en ${diaSemana(pl.finTeorico, lang)}, així que el termini s’allarga fins al ${diaSemana(pl.fin, lang)} següent.`) : '';
    return {
      titulo: L(lang, `Modelo 303 del ${nt} trimestre de ${anio}: plazo y ejemplo`, `Model 303 del ${nt} trimestre del ${anio}: termini i exemple`),
      h1: L(lang, `Modelo 303 del ${nt} trimestre (${t}T ${anio})`, `Model 303 del ${nt} trimestre (${t}T ${anio})`),
      descripcion: L(lang, `El IVA del ${t}T ${anio} se presenta del ${fechaLarga(pl.ini, lang)} al ${fechaLarga(pl.fin, lang)} (domiciliado, hasta el ${fechaLarga(pl.domiciliacion, lang)}). Ejemplo calculado casilla a casilla.`, `L’IVA del ${t}T ${anio} es presenta del ${fechaLarga(pl.ini, lang)} al ${fechaLarga(pl.fin, lang)} (domiciliat, fins al ${fechaLarga(pl.domiciliacion, lang)}). Exemple calculat casella a casella.`),
      intro: L(lang,
        `<p>El modelo 303 del <strong>${nt} trimestre de ${anio}</strong> (${['enero a marzo', 'abril a junio', 'julio a septiembre', 'octubre a diciembre'][t - 1]}) se presenta <strong>del ${fechaLarga(pl.ini, lang)} al ${diaSemana(pl.fin, lang)} ${fechaLarga(pl.fin, lang)}</strong>. Si lo domicilias, el plazo acaba el ${fechaLarga(pl.domiciliacion, lang)}.${movido}${extra4T}</p><p>Ejemplo: un autónomo que factura ${eur(q.ventas, lang)} más IVA al 21 % repercute ${eur(res.devengado, lang, 2)} y ha soportado ${eur(q.soportado, lang)} en sus gastos${q.compensarEntrada ? `, y arrastra ${eur(q.compensarEntrada, lang, 2)} a compensar del trimestre anterior` : ''}: el 303 ${resultadoTxt(lang)}.</p>`,
        `<p>El model 303 del <strong>${nt} trimestre del ${anio}</strong> (${['de gener a març', 'd’abril a juny', 'de juliol a setembre', 'd’octubre a desembre'][t - 1]}) es presenta <strong>del ${fechaLarga(pl.ini, lang)} al ${diaSemana(pl.fin, lang)} ${fechaLarga(pl.fin, lang)}</strong>. Si el domicilies, el termini acaba el ${fechaLarga(pl.domiciliacion, lang)}.${movido}${extra4T}</p><p>Exemple: un autònom que factura ${eur(q.ventas, lang)} més IVA al 21 % repercuteix ${eur(res.devengado, lang, 2)} i ha suportat ${eur(q.soportado, lang)} a les seves despeses${q.compensarEntrada ? `, i arrossega ${eur(q.compensarEntrada, lang, 2)} a compensar del trimestre anterior` : ''}: el 303 ${resultadoTxt(lang)}.</p>`),
      tablas: [
        { titulo: tt(`Ejemplo del ${t}T ${anio}`, `Exemple del ${t}T ${anio}`), cab: [tt('Concepto', 'Concepte'), tt('Importe', 'Import')], formatos: ['txt', 'eur'], filas: [
          [tt('Base imponible de las ventas (21 %)', 'Base imposable de les vendes (21 %)'), q.ventas],
          [tt('IVA devengado (repercutido)', 'IVA meritat (repercutit)'), res.devengado],
          [tt('IVA soportado deducible', 'IVA suportat deduïble'), res.soportado],
          [tt('Cuotas a compensar de periodos anteriores', 'Quotes a compensar de períodes anteriors'), res.compensar],
          [tt('Resultado', 'Resultat'), res.resultado],
        ] },
        { titulo: tt(`Plazos del modelo 303 en ${anio}`, `Terminis del model 303 el ${anio}`), cab: [tt('Trimestre', 'Trimestre'), tt('Desde', 'Des de'), tt('Hasta', 'Fins a'), tt('Domiciliación hasta', 'Domiciliació fins a'), tt('Resultado del ejemplo', 'Resultat de l’exemple')], formatos: ['txt', 'fecha', 'fecha', 'fecha', 'eur'],
          filas: s.map((x) => { const p2 = plazo(x.t, anio); return [`${x.t}T`, p2.ini, p2.fin, p2.domiciliacion, x.r.resultado]; }) },
      ],
      calc: 'modelo-303',
      query: { trimestre: t, v21: q.ventas, soportado: q.soportado, compensar: q.compensarEntrada },
      cifra: { e: L(lang, 'Último día para presentarlo', 'Últim dia per presentar-lo'), v: Number(pl.fin.slice(8, 10)), f: 'num0', nota: L(lang, `${diaSemana(pl.fin, lang)}, ${fechaLarga(pl.fin, lang)}`, `${diaSemana(pl.fin, lang)}, ${fechaLarga(pl.fin, lang)}`),
        extra: [{ e: L(lang, 'Resultado del ejemplo', 'Resultat de l’exemple'), v: res.resultado, f: 'eur' }, { e: L(lang, 'IVA repercutido', 'IVA repercutit'), v: res.devengado, f: 'eur0' }] },
      grafico: { tipo: 'barras', titulo: L(lang, `Resultado del 303 en cada trimestre del ejemplo`, `Resultat del 303 a cada trimestre de l’exemple`), formato: 'eur0',
        desc: L(lang, `Ingresos a Hacienda por trimestre; un trimestre negativo se compensa en el siguiente. ${t}T: ${eur(res.resultado, lang)}.`, `Ingressos a Hisenda per trimestre; un trimestre negatiu es compensa al següent. ${t}T: ${eur(res.resultado, lang)}.`),
        filas: s.map((x) => ({ e: `${x.t}T`, v: x.r.aIngresar, act: x.t === t })) },
      faq: [
        { p: L(lang, `¿Hasta cuándo se presenta el modelo 303 del ${t}T de ${anio}?`, `Fins quan es presenta el model 303 del ${t}T del ${anio}?`),
          r: L(lang, `Hasta el ${diaSemana(pl.fin, lang)} ${fechaLarga(pl.fin, lang)}; si quieres domiciliar el pago, hasta el ${fechaLarga(pl.domiciliacion, lang)}. Se puede presentar desde el ${fechaLarga(pl.ini, lang)}.`, `Fins al ${diaSemana(pl.fin, lang)} ${fechaLarga(pl.fin, lang)}; si vols domiciliar el pagament, fins al ${fechaLarga(pl.domiciliacion, lang)}. Es pot presentar des del ${fechaLarga(pl.ini, lang)}.`) },
        { p: L(lang, `¿Qué pasa si presento el 303 del ${t}T tarde?`, `Què passa si presento el 303 del ${t}T tard?`),
          r: L(lang, `Sin requerimiento de Hacienda pagas un recargo del 1 % más un 1 % por cada mes completo de retraso. Con ${eur(Math.max(res.aIngresar, 1000), lang)} a ingresar y mes y medio tarde, el recargo es del ${rec.pct} %: ${eur(rec.recargo, lang, 2)}.`, `Sense requeriment d’Hisenda pagues un recàrrec de l’1 % més un 1 % per cada mes complet de retard. Amb ${eur(Math.max(res.aIngresar, 1000), lang)} a ingressar i un mes i mig tard, el recàrrec és del ${rec.pct} %: ${eur(rec.recargo, lang, 2)}.`) },
        { p: L(lang, `¿Y si el 303 del ${t}T sale negativo?`, `I si el 303 del ${t}T surt negatiu?`),
          r: t === 4 ? L(lang, `En el cuarto trimestre puedes elegir entre pedir la devolución o compensarlo en el primer trimestre de ${anio + 1}. En el ejemplo, ${resultadoTxt(lang)}.`, `Al quart trimestre pots triar entre demanar la devolució o compensar-ho al primer trimestre del ${anio + 1}. A l’exemple, ${resultadoTxt(lang)}.`)
            : L(lang, `Se deja a compensar y se resta en el siguiente trimestre (la devolución solo se pide en el 4T o si estás en el REDEME). En el ejemplo, ${resultadoTxt(lang)}.`, `Es deixa a compensar i es resta al trimestre següent (la devolució només es demana al 4T o si ets al REDEME). A l’exemple, ${resultadoTxt(lang)}.`) },
      ],
      enlaces: [
        ...filas.filter((f) => f !== fila).map((f) => ({ fila: f, texto: L(lang, `303 del ${f.t}T`, `303 del ${f.t}T`) })),
        { col: 'modelo-130-trimestre', fila, texto: L(lang, `Modelo 130 del ${t}T`, `Model 130 del ${t}T`) },
      ],
    };
  },

  'modelo-130-trimestre'(fila, { P, lang, anio, filas }) {
    const t = Number(fila.t);
    const pl = plazo(t, anio);
    const s = serie130(P.fiscal);
    const q = s[t - 1];
    const res = q.r;
    const nt = nomT(t, lang);
    const pct = res.pct;
    const movido = pl.movido ? L(lang, ` El ${fechaLarga(pl.finTeorico, lang)} cae en ${diaSemana(pl.finTeorico, lang)}, así que el plazo se alarga al ${diaSemana(pl.fin, lang)} siguiente.`, ` El ${fechaLarga(pl.finTeorico, lang)} cau en ${diaSemana(pl.finTeorico, lang)}, així que el termini s’allarga fins al ${diaSemana(pl.fin, lang)} següent.`) : '';
    const acumulado = t === 1 ? L(lang, 'del primer trimestre', 'del primer trimestre') : L(lang, `acumulado de enero a ${['marzo', 'junio', 'septiembre', 'diciembre'][t - 1]}`, `acumulat de gener a ${['març', 'juny', 'setembre', 'desembre'][t - 1]}`);
    return {
      titulo: L(lang, `Modelo 130 del ${nt} trimestre de ${anio}: plazo y cálculo`, `Model 130 del ${nt} trimestre del ${anio}: termini i càlcul`),
      h1: L(lang, `Modelo 130 del ${nt} trimestre (${t}T ${anio})`, `Model 130 del ${nt} trimestre (${t}T ${anio})`),
      descripcion: L(lang, `El pago fraccionado del ${t}T ${anio} se presenta del ${fechaLarga(pl.ini, lang)} al ${fechaLarga(pl.fin, lang)}. Ejemplo con rendimiento acumulado: ${eur(res.aIngresar, lang, 2)} a ingresar.`, `El pagament fraccionat del ${t}T ${anio} es presenta del ${fechaLarga(pl.ini, lang)} al ${fechaLarga(pl.fin, lang)}. Exemple amb rendiment acumulat: ${eur(res.aIngresar, lang, 2)} a ingressar.`),
      intro: L(lang,
        `<p>El modelo 130 del <strong>${nt} trimestre de ${anio}</strong> se presenta <strong>del ${fechaLarga(pl.ini, lang)} al ${diaSemana(pl.fin, lang)} ${fechaLarga(pl.fin, lang)}</strong> (domiciliado, hasta el ${fechaLarga(pl.domiciliacion, lang)}).${movido} Es un adelanto del IRPF: el ${pct} % del rendimiento ${acumulado}, menos lo ya pagado en los 130 anteriores del año y las retenciones de tus facturas.</p><p>Ejemplo: con ${eur(q.ing, lang)} de ingresos y ${eur(q.gas, lang)} de gastos acumulados, el ${pct} % del rendimiento son ${eur(res.pago, lang, 2)}${q.pagadoAntes ? `; restando los ${eur(q.pagadoAntes, lang, 2)} ya pagados este año` : ''}, el 130 del ${t}T sale a <strong>${eur(res.aIngresar, lang, 2)}</strong>.${t === 4 ? L(lang, ' El cuarto trimestre no cierra el año: la cuenta final la hace la renta, en la que se descuentan los cuatro pagos.', '') : ''}</p>`,
        `<p>El model 130 del <strong>${nt} trimestre del ${anio}</strong> es presenta <strong>del ${fechaLarga(pl.ini, lang)} al ${diaSemana(pl.fin, lang)} ${fechaLarga(pl.fin, lang)}</strong> (domiciliat, fins al ${fechaLarga(pl.domiciliacion, lang)}).${movido} És una bestreta de l’IRPF: el ${pct} % del rendiment ${acumulado}, menys el que ja s’ha pagat als 130 anteriors de l’any i les retencions de les teves factures.</p><p>Exemple: amb ${eur(q.ing, lang)} d’ingressos i ${eur(q.gas, lang)} de despeses acumulats, el ${pct} % del rendiment són ${eur(res.pago, lang, 2)}${q.pagadoAntes ? `; restant els ${eur(q.pagadoAntes, lang, 2)} ja pagats aquest any` : ''}, el 130 del ${t}T surt a <strong>${eur(res.aIngresar, lang, 2)}</strong>.${t === 4 ? ' El quart trimestre no tanca l’any: el compte final el fa la renda, en què es descompten els quatre pagaments.' : ''}</p>`),
      tablas: [
        { titulo: tt(`Cálculo del ${t}T ${anio}`, `Càlcul del ${t}T ${anio}`), cab: [tt('Concepto', 'Concepte'), tt('Importe', 'Import')], formatos: ['txt', 'eur'], filas: [
          [tt('Ingresos acumulados', 'Ingressos acumulats'), q.ing],
          [tt('Gastos acumulados', 'Despeses acumulades'), q.gas],
          [tt('Rendimiento neto', 'Rendiment net'), res.rend],
          [tt(`${pct} % del rendimiento`, `${pct} % del rendiment`), res.pago],
          [tt('Pagos de trimestres anteriores', 'Pagaments de trimestres anteriors'), q.pagadoAntes],
          [tt('A ingresar', 'A ingressar'), res.aIngresar],
        ] },
        { titulo: tt(`Plazos y pagos del ejemplo en ${anio}`, `Terminis i pagaments de l’exemple el ${anio}`), cab: [tt('Trimestre', 'Trimestre'), tt('Hasta', 'Fins a'), tt('Rendimiento acumulado', 'Rendiment acumulat'), tt('A ingresar', 'A ingressar')], formatos: ['txt', 'fecha', 'eur0', 'eur'],
          filas: s.map((x) => [`${x.t}T`, plazo(x.t, anio).fin, x.r.rend, x.r.aIngresar]) },
      ],
      calc: 'modelo-130',
      query: { trimestre: t, ingresos: q.ing, gastos: q.gas, retenciones: 0, anteriores: q.pagadoAntes, rendAnterior: 20000 },
      cifra: { e: L(lang, 'Último día para presentarlo', 'Últim dia per presentar-lo'), v: Number(pl.fin.slice(8, 10)), f: 'num0', nota: L(lang, `${diaSemana(pl.fin, lang)}, ${fechaLarga(pl.fin, lang)}`, `${diaSemana(pl.fin, lang)}, ${fechaLarga(pl.fin, lang)}`),
        extra: [{ e: L(lang, 'A ingresar en el ejemplo', 'A ingressar a l’exemple'), v: res.aIngresar, f: 'eur' }, { e: L(lang, 'Rendimiento acumulado', 'Rendiment acumulat'), v: res.rend, f: 'eur0' }] },
      grafico: { tipo: 'barras', titulo: L(lang, 'Pago del 130 en cada trimestre del ejemplo', 'Pagament del 130 a cada trimestre de l’exemple'), formato: 'eur0',
        desc: L(lang, `${t}T: ${eur(res.aIngresar, lang)}. El pago depende del rendimiento acumulado y de lo ya pagado.`, `${t}T: ${eur(res.aIngresar, lang)}. El pagament depèn del rendiment acumulat i del que ja s’ha pagat.`),
        filas: s.map((x) => ({ e: `${x.t}T`, v: x.r.aIngresar, act: x.t === t })) },
      faq: [
        { p: L(lang, `¿Hasta cuándo se presenta el modelo 130 del ${t}T de ${anio}?`, `Fins quan es presenta el model 130 del ${t}T del ${anio}?`),
          r: L(lang, `Hasta el ${diaSemana(pl.fin, lang)} ${fechaLarga(pl.fin, lang)}, o hasta el ${fechaLarga(pl.domiciliacion, lang)} si domicilias el pago.`, `Fins al ${diaSemana(pl.fin, lang)} ${fechaLarga(pl.fin, lang)}, o fins al ${fechaLarga(pl.domiciliacion, lang)} si domicilies el pagament.`) },
        { p: L(lang, `¿Cuánto pago en el 130 del ${t}T si gano ${eur(r2((q.ing - q.gas) / t), lang)} netos al trimestre?`, `Quant pago al 130 del ${t}T si guanyo ${eur(r2((q.ing - q.gas) / t), lang)} nets al trimestre?`),
          r: L(lang, `El ${pct} % del rendimiento acumulado (${eur(res.rend, lang)}) son ${eur(res.pago, lang, 2)}; restando lo pagado antes (${eur(q.pagadoAntes, lang, 2)}), ${eur(res.aIngresar, lang, 2)}.`, `El ${pct} % del rendiment acumulat (${eur(res.rend, lang)}) són ${eur(res.pago, lang, 2)}; restant el que s’ha pagat abans (${eur(q.pagadoAntes, lang, 2)}), ${eur(res.aIngresar, lang, 2)}.`) },
        { p: L(lang, '¿Tengo que presentar el 130 si todas mis facturas llevan retención?', 'He de presentar el 130 si totes les meves factures porten retenció?'),
          r: L(lang, `No, si el año anterior al menos el 70 % de tus ingresos profesionales tuvo retención. Con ${eur(q.ing, lang)} facturados hasta el ${t}T y un 15 % de retención, ya habrías adelantado ${eur(q.ing * 0.15, lang)}.`, `No, si l’any anterior almenys el 70 % dels teus ingressos professionals va tenir retenció. Amb ${eur(q.ing, lang)} facturats fins al ${t}T i un 15 % de retenció, ja hauries avançat ${eur(q.ing * 0.15, lang)}.`) },
      ],
      enlaces: [
        ...filas.filter((f) => f !== fila).map((f) => ({ fila: f, texto: L(lang, `130 del ${f.t}T`, `130 del ${f.t}T`) })),
        { col: 'modelo-303-trimestre', fila, texto: L(lang, `Modelo 303 del ${t}T`, `Model 303 del ${t}T`) },
      ],
    };
  },

  'iva-producto'(fila, { lang, anio, filas }) {
    const tipo = Number(fila.tipo);
    const exento = tipo === 0;
    const pl = fila.pl === '1';
    const V = (es1: string, esP: string, ca1: string, caP: string) => (lang === 'es' ? (pl ? esP : es1) : pl ? caP : ca1);
    const n = lang === 'es' ? fila.nombre_es : fila.nombre_ca; // «la luz», «el pan», «los libros»…
    const N = n.replace(/^./, (x) => x.toUpperCase());
    const deN = deArt(n, lang);
    const exT = (fila.fem === '1' ? (lang === 'es' ? (pl ? 'exentas' : 'exenta') : pl ? 'exemptes' : 'exempta') : lang === 'es' ? (pl ? 'exentos' : 'exento') : pl ? 'exempts' : 'exempt');
    const ud = lang === 'es' ? fila.unidad_es : fila.unidad_ca; // «factura de luz»
    const nota = lang === 'es' ? fila.nota_es : fila.nota_ca;
    const ej = fila.ejemplos.split('|').map(Number);
    const mid = ej[1];
    const iva = (b: number, tp = tipo) => r2(b * tp / 100);
    const sin = (p: number) => r2(p / (1 + tipo / 100));
    const art = `<a href="${LEY_IVA}#a${fila.articulo.split('.')[0]}" rel="noopener">${L(lang, 'artículo', 'article')} ${fila.articulo} ${L(lang, 'de la Ley 37/1992 del IVA', 'de la Llei 37/1992 de l’IVA')}</a>`;
    const nTipo = (tp: number) => (tp === 21 ? L(lang, 'general', 'general') : tp === 10 ? L(lang, 'reducido', 'reduït') : tp === 4 ? L(lang, 'superreducido', 'superreduït') : L(lang, 'exento', 'exempt'));
    const pvps = ej.map((b) => Math.round(b * (1 + tipo / 100)));
    const comparacion = tipo === 21 ? 10 : 21;
    const difComp = r2(Math.abs(iva(mid, comparacion) - iva(mid)));
    const hermanas = filas.filter((f) => f !== fila && f.tipo === fila.tipo);
    const otras = filas.filter((f) => f.tipo !== fila.tipo);
    const frase = exento
      ? L(lang, `<p><strong>${N} ${V('está', 'están', '', '')} ${exT} de IVA</strong> (${art}): el precio no lleva IVA y quien presta el servicio no lo repercute. Una ${ud} de ${eur(mid, lang)} se paga tal cual; si tributara al 21 % costaría ${eur(mid + iva(mid, 21), lang, 2)}.</p>`,
        `<p><strong>${N} ${V('', '', 'està', 'estan')} ${exT} d’IVA</strong> (${art}): el preu no porta IVA i qui presta el servei no el repercuteix. Una ${ud} de ${eur(mid, lang)} es paga tal com és; si tributés al 21 % costaria ${eur(mid + iva(mid, 21), lang, 2)}.</p>`)
      : L(lang, `<p><strong>${N} ${V('paga', 'pagan', '', '')} el ${tipo} % de IVA</strong>, el tipo ${nTipo(tipo)} (${art}). En una ${ud} de <strong>${eur(mid, lang)} sin IVA</strong> pagas <strong>${eur(iva(mid), lang, 2)} de IVA</strong>: ${eur(mid + iva(mid), lang, 2)} en total. Al revés, de un precio final de ${eur(pvps[1], lang)}, ${eur(r2(pvps[1] - sin(pvps[1])), lang, 2)} son IVA. Al ${comparacion} % pagarías ${eur(difComp, lang, 2)} ${comparacion > tipo ? 'más' : 'menos'}.</p>`,
        `<p><strong>${N} ${V('', '', 'paga', 'paguen')} el ${tipo} % d’IVA</strong>, el tipus ${nTipo(tipo)} (${art}). En una ${ud} de <strong>${eur(mid, lang)} sense IVA</strong> pagues <strong>${eur(iva(mid), lang, 2)} d’IVA</strong>: ${eur(mid + iva(mid), lang, 2)} en total. A l’inrevés, d’un preu final de ${eur(pvps[1], lang)}, ${eur(r2(pvps[1] - sin(pvps[1])), lang, 2)} són IVA. Al ${comparacion} % pagaries ${eur(difComp, lang, 2)} ${comparacion > tipo ? 'més' : 'menys'}.</p>`);
    const tablas: Tabla[] = exento ? [
      { titulo: tt('Lo que costaría si no estuviera exento', 'El que costaria si no estigués exempt'), cab: [tt('Precio (sin IVA)', 'Preu (sense IVA)'), tt('Si fuera al 21 %', 'Si fos al 21 %'), tt('Si fuera al 10 %', 'Si fos al 10 %'), tt('Ahorro frente al 21 %', 'Estalvi respecte al 21 %')], formatos: ['eur', 'eur', 'eur', 'eur'], filas: ej.map((b) => [b, r2(b * 1.21), r2(b * 1.1), iva(b, 21)]) },
    ] : [
      { titulo: tt('Ejemplos con el precio sin IVA', 'Exemples amb el preu sense IVA'), cab: [tt('Base sin IVA', 'Base sense IVA'), tt(`IVA (${tipo} %)`, `IVA (${tipo} %)`), tt('Total', 'Total')], formatos: ['eur', 'eur', 'eur'], filas: ej.map((b) => [b, iva(b), r2(b + iva(b))]) },
    ];
    if (!exento) tablas.push({ titulo: tt('Quitar el IVA de un precio final', 'Treure l’IVA d’un preu final'), cab: [tt('Precio con IVA', 'Preu amb IVA'), tt('Base sin IVA', 'Base sense IVA'), tt('IVA incluido', 'IVA inclòs')], formatos: ['eur', 'eur', 'eur'], filas: pvps.map((p) => [p, sin(p), r2(p - sin(p))]) });
    tablas.push({ titulo: tt(`La misma ${fila.unidad_es} de ${num(mid, 'es')} € con cada tipo`, `La mateixa ${fila.unidad_ca} de ${num(mid, 'ca')} € amb cada tipus`), cab: [tt('Tipo', 'Tipus'), tt('IVA', 'IVA'), tt('Total', 'Total')], formatos: ['txt', 'eur', 'eur'], filas: [21, 10, 4, 0].map((tp) => [`${tp} %${tp === tipo ? ' ←' : ''}`, iva(mid, tp), r2(mid + iva(mid, tp))]) });
    return {
      titulo: L(lang, `IVA ${deN} en ${anio}: ${exento ? 'exento' : `${tipo} %`} y ejemplos`, `IVA ${deN} el ${anio}: ${exento ? 'exempt' : `${tipo} %`} i exemples`),
      h1: L(lang, `¿Qué IVA ${V('tiene', 'tienen', '', '')} ${n}? (${anio})`, `Quin IVA ${V('', '', 'té', 'tenen')} ${n}? (${anio})`),
      descripcion: exento
        ? L(lang, `${N} ${V('está', 'están', '', '')} ${exT} de IVA en ${anio} (art. ${fila.articulo} de la Ley 37/1992). Qué significa, ejemplos con importes reales y cuánto costaría con IVA.`, `${N} ${V('', '', 'està', 'estan')} ${exT} d’IVA el ${anio} (art. ${fila.articulo} de la Llei 37/1992). Què vol dir, exemples amb imports reals i quant costaria amb IVA.`)
        : L(lang, `${N} ${V('lleva', 'llevan', '', '')} un IVA del ${tipo} % en ${anio} (art. ${fila.articulo} de la Ley 37/1992). En una ${ud} de ${eur(mid, lang)} son ${eur(iva(mid), lang, 2)} de IVA.`, `${N} ${V('', '', 'porta', 'porten')} un IVA del ${tipo} % el ${anio} (art. ${fila.articulo} de la Llei 37/1992). En una ${ud} de ${eur(mid, lang)} són ${eur(iva(mid), lang, 2)} d’IVA.`),
      intro: `${frase}<p>${nota}</p>`,
      tablas,
      calc: 'iva',
      query: { importe: mid, tipo, modo: 'anadir' },
      cifra: { e: L(lang, `IVA ${deN}`, `IVA ${deN}`), v: tipo, f: 'pct', nota: exento ? L(lang, `Exento por el art. ${fila.articulo} de la Ley 37/1992`, `Exempt per l’art. ${fila.articulo} de la Llei 37/1992`) : L(lang, `Tipo ${nTipo(tipo)} · art. ${fila.articulo} de la Ley 37/1992`, `Tipus ${nTipo(tipo)} · art. ${fila.articulo} de la Llei 37/1992`),
        extra: [{ e: L(lang, `IVA en ${eur(mid, lang)}`, `IVA en ${eur(mid, lang)}`), v: iva(mid), f: 'eur' }, { e: L(lang, 'Total', 'Total'), v: r2(mid + iva(mid)), f: 'eur' }] },
      grafico: { tipo: 'barras', titulo: L(lang, `IVA de una ${ud} de ${eur(mid, lang)} según el tipo`, `IVA d’una ${ud} de ${eur(mid, lang)} segons el tipus`), formato: 'eur',
        desc: L(lang, `Al 21 %: ${eur(iva(mid, 21), lang, 2)}; al 10 %: ${eur(iva(mid, 10), lang, 2)}; al 4 %: ${eur(iva(mid, 4), lang, 2)}. ${N}: ${eur(iva(mid), lang, 2)}.`, `Al 21 %: ${eur(iva(mid, 21), lang, 2)}; al 10 %: ${eur(iva(mid, 10), lang, 2)}; al 4 %: ${eur(iva(mid, 4), lang, 2)}. ${N}: ${eur(iva(mid), lang, 2)}.`),
        filas: [21, 10, 4, 0].map((tp) => ({ e: tp ? `${tp} % (${nTipo(tp)})` : L(lang, 'Exento', 'Exempt'), v: iva(mid, tp), act: tp === tipo })) },
      faq: [
        { p: L(lang, `¿Qué IVA ${V('tiene', 'tienen', '', '')} ${n} en ${anio}?`, `Quin IVA ${V('', '', 'té', 'tenen')} ${n} el ${anio}?`),
          r: exento ? L(lang, `Ninguno: ${V('está', 'están', '', '')} ${exT} por el artículo ${fila.articulo} de la Ley 37/1992. En una ${ud} de ${eur(mid, lang)} no se suma IVA.`, `Cap: ${V('', '', 'està', 'estan')} ${exT} per l’article ${fila.articulo} de la Llei 37/1992. En una ${ud} de ${eur(mid, lang)} no s’hi suma IVA.`)
            : L(lang, `El ${tipo} % (tipo ${nTipo(tipo)}, artículo ${fila.articulo} de la Ley 37/1992). Por cada 100 € sin IVA pagas ${eur(tipo, lang)} de IVA.`, `El ${tipo} % (tipus ${nTipo(tipo)}, article ${fila.articulo} de la Llei 37/1992). Per cada 100 € sense IVA pagues ${eur(tipo, lang)} d’IVA.`) },
        exento
          ? { p: L(lang, `¿Cuánto me ahorro porque ${n} ${V('esté', 'estén', '', '')} ${exT}?`, `Quant m’estalvio perquè ${n} ${V('', '', 'estigui', 'estiguin')} ${exT}?`),
              r: L(lang, `En una ${ud} de ${eur(ej[2], lang)}, ${eur(iva(ej[2], 21), lang, 2)} frente al 21 % o ${eur(iva(ej[2], 10), lang, 2)} frente al 10 %.`, `En una ${ud} de ${eur(ej[2], lang)}, ${eur(iva(ej[2], 21), lang, 2)} respecte al 21 % o ${eur(iva(ej[2], 10), lang, 2)} respecte al 10 %.`) }
          : { p: L(lang, `¿Cuánto IVA pago en una ${ud} de ${eur(ej[2], lang)}?`, `Quant IVA pago en una ${ud} de ${eur(ej[2], lang)}?`),
              r: L(lang, `Si los ${eur(ej[2], lang)} son sin IVA, ${eur(iva(ej[2]), lang, 2)} de IVA y ${eur(ej[2] + iva(ej[2]), lang, 2)} en total. Si ya lo incluyen, el IVA es ${eur(r2(ej[2] - sin(ej[2])), lang, 2)} y la base, ${eur(sin(ej[2]), lang, 2)}.`, `Si els ${eur(ej[2], lang)} són sense IVA, ${eur(iva(ej[2]), lang, 2)} d’IVA i ${eur(ej[2] + iva(ej[2]), lang, 2)} en total. Si ja l’inclouen, l’IVA és ${eur(r2(ej[2] - sin(ej[2])), lang, 2)} i la base, ${eur(sin(ej[2]), lang, 2)}.`) },
        ...(exento ? [] : [{ p: L(lang, `¿Cómo quito el IVA del ${tipo} % a un precio?`, `Com trec l’IVA del ${tipo} % d’un preu?`),
          r: L(lang, `Divide entre ${num(1 + tipo / 100, lang, 2)}. Por ejemplo, ${eur(pvps[0], lang)} ÷ ${num(1 + tipo / 100, lang, 2)} = ${eur(sin(pvps[0]), lang, 2)} sin IVA; la diferencia, ${eur(r2(pvps[0] - sin(pvps[0])), lang, 2)}, es el IVA.`, `Divideix entre ${num(1 + tipo / 100, lang, 2)}. Per exemple, ${eur(pvps[0], lang)} ÷ ${num(1 + tipo / 100, lang, 2)} = ${eur(sin(pvps[0]), lang, 2)} sense IVA; la diferència, ${eur(r2(pvps[0] - sin(pvps[0])), lang, 2)}, és l’IVA.`) }]),
      ],
      enlaces: [...hermanas, ...otras.slice(0, Math.max(0, 10 - hermanas.length))].map((f) => ({ fila: f, texto: `IVA ${deArt(lang === 'es' ? f.nombre_es : f.nombre_ca, lang)}` })),
    };
  },
};

/** «de la luz», «del pan», «de los libros» / «de la llum», «del pa», «dels llibres», «de l’aigua». */
function deArt(n: string, l: 'es' | 'ca'): string {
  if (n.startsWith('el ')) return `del ${n.slice(3)}`;
  if (l === 'ca' && n.startsWith('els ')) return `dels ${n.slice(4)}`;
  return `de ${n}`;
}
