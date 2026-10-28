// Motores laborales: nómina neta, finiquito, indemnización, paro, subsidio, incapacidad temporal,
// jubilación y cuota de autónomos. Cifras siempre desde params (L = laboral.json, F = fiscal.json).
import { r2, pos, clamp, diasEntre, mesesIniciados, sumarMeses, sumarDias, cuotaEscala } from './base';
import { cotizacion, type Contrato } from './ss';
import { retencion, cuotaAnual, baseTrabajo, type Familia } from './irpf';

export interface EntradaNeto extends Familia {
  brutoAnual: number;
  pagas: 12 | 14;
  contrato?: Contrato;
  ccaa?: string;
  grupo?: string;
  contratoInferiorAno?: boolean;
  parcial?: boolean;
}

export function sueldoNeto(e: EntradaNeto, P: { laboral: any; fiscal: any }) {
  const L = P.laboral, F = P.fiscal;
  const ss = cotizacion({ brutoAnual: e.brutoAnual, contrato: e.contrato, grupo: e.grupo, parcial: e.parcial }, L);
  const ret = retencion({ ...e, ssAnual: ss.trabajador.anual, contratoInferiorAno: e.contratoInferiorAno ?? e.contrato === 'temporal' }, F);
  const netoAnual = e.brutoAnual - ss.trabajador.anual - ret.importe;
  const brutoPaga = e.brutoAnual / e.pagas;
  const irpfPaga = brutoPaga * ret.tipo / 100;
  const ordinaria = brutoPaga - ss.trabajador.mensual - irpfPaga;
  const extra = e.pagas === 14 ? brutoPaga - irpfPaga : 0;
  let renta = null as null | { cuota: number; diferencia: number; tipoMedio: number; tipoMarginal: number };
  if (e.ccaa) {
    const bt = baseTrabajo(e.brutoAnual, ss.trabajador.anual, F, e);
    const c = cuotaAnual({ ...e, baseGeneral: bt.base, ccaa: e.ccaa, rendimientosTrabajoIntegros: e.brutoAnual }, F);
    renta = { cuota: c.total, diferencia: r2(c.total - ret.importe), tipoMedio: c.tipoMedio, tipoMarginal: c.tipoMarginal };
  }
  return {
    ss,
    ret,
    netoAnual: r2(netoAnual),
    netoMensualMedio: r2(netoAnual / 12),
    brutoPaga: r2(brutoPaga),
    irpfPaga: r2(irpfPaga),
    netoOrdinaria: r2(ordinaria),
    netoExtra: r2(extra),
    costeEmpresa: r2(e.brutoAnual + ss.empresa.anual),
    renta,
  };
}

/** Bruto anual necesario para un neto anual dado (búsqueda binaria sobre el motor directo). */
export function brutoDesdeNeto(netoAnualObjetivo: number, e: Omit<EntradaNeto, 'brutoAnual'>, P: { laboral: any; fiscal: any }): number {
  let lo = netoAnualObjetivo, hi = netoAnualObjetivo * 2.2 + 5000;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (sueldoNeto({ ...e, brutoAnual: mid } as EntradaNeto, P).netoAnual < netoAnualObjetivo) lo = mid;
    else hi = mid;
  }
  return r2(hi);
}

/* ---------------------------------------------------------------- Indemnización por despido */
export type TipoDespido = 'improcedente' | 'objetivo' | 'temporal' | 'procedente';

export function indemnizacion(e: { inicio: string; fin: string; brutoAnual: number; tipo: TipoDespido }, L: any) {
  const I = L.indemnizacion;
  const diario = e.brutoAnual / 365;
  const corte = '2012-02-12';
  const res = { diario: r2(diario), dias: 0, importe: 0, tramos: [] as { desde: string; hasta: string; meses: number; diasPorAno: number; dias: number }[], tope: '' as string, antiguedadDias: diasEntre(e.inicio, e.fin) };
  if (e.tipo === 'procedente') return res;
  if (e.tipo === 'temporal') {
    const meses = mesesIniciados(e.inicio, e.fin);
    const dias = I.fin_contrato_temporal_dias_por_ano * meses / 12;
    res.tramos.push({ desde: e.inicio, hasta: e.fin, meses, diasPorAno: I.fin_contrato_temporal_dias_por_ano, dias: r2(dias) });
    res.dias = r2(dias);
    res.importe = r2(dias * diario);
    return res;
  }
  if (e.tipo === 'objetivo') {
    const meses = mesesIniciados(e.inicio, e.fin);
    let dias = I.objetivo_dias_por_ano * meses / 12;
    const tope = I.objetivo_tope_mensualidades * 30;
    if (dias > tope) { dias = tope; res.tope = 'objetivo'; }
    res.tramos.push({ desde: e.inicio, hasta: e.fin, meses, diasPorAno: I.objetivo_dias_por_ano, dias: r2(dias) });
    res.dias = r2(dias);
    res.importe = r2(dias * diario);
    return res;
  }
  // Improcedente: dos tramos si el contrato es anterior al 12/02/2012 (disposición transitoria 11.ª ET)
  let dias = 0;
  if (e.inicio < corte) {
    const finAnt = e.fin < corte ? e.fin : '2012-02-11';
    // Los meses se cuentan sobre el periodo total para no contar dos veces el mes frontera
    const total = mesesIniciados(e.inicio, e.fin);
    const m1 = e.fin < corte ? total : Math.min(total, mesesIniciados(e.inicio, finAnt));
    const d1 = I.anterior_12_02_2012_dias_por_ano * m1 / 12;
    res.tramos.push({ desde: e.inicio, hasta: finAnt, meses: m1, diasPorAno: I.anterior_12_02_2012_dias_por_ano, dias: r2(d1) });
    let d2 = 0;
    if (e.fin >= corte) {
      const m2 = Math.max(0, total - m1);
      d2 = I.improcedente_dias_por_ano * m2 / 12;
      res.tramos.push({ desde: corte, hasta: e.fin, meses: m2, diasPorAno: I.improcedente_dias_por_ano, dias: r2(d2) });
    }
    const tope720 = I.improcedente_tope_mensualidades * 30;
    const tope1260 = I.anterior_tope_mensualidades * 30;
    if (d1 > tope720) { dias = Math.min(d1, tope1260); res.tope = d1 > tope1260 ? '42' : 'tramo1'; }
    else { dias = Math.min(d1 + d2, tope720); if (d1 + d2 > tope720) res.tope = '24'; }
  } else {
    const m = mesesIniciados(e.inicio, e.fin);
    dias = I.improcedente_dias_por_ano * m / 12;
    res.tramos.push({ desde: e.inicio, hasta: e.fin, meses: m, diasPorAno: I.improcedente_dias_por_ano, dias: r2(dias) });
    const tope = I.improcedente_tope_mensualidades * 30;
    if (dias > tope) { dias = tope; res.tope = '24'; }
  }
  res.dias = r2(dias);
  res.importe = r2(dias * diario);
  return res;
}

/* ---------------------------------------------------------------- Finiquito */
export interface EntradaFiniquito {
  salarioMensual: number; // bruto mensual de una paga (sin prorrata)
  pagas: 12 | 14;
  inicioContrato: string;
  fin: string;
  vacacionesDisfrutadas: number; // días naturales disfrutados en el año en curso
  diasVacacionesAnuales?: number;
  devengoExtras?: 'semestral' | 'anual';
  incluirSalarioMes?: boolean;
}

export function finiquito(e: EntradaFiniquito, L: any) {
  const anual = e.salarioMensual * e.pagas;
  const diario = anual / 365;
  const fin = e.fin;
  const y = fin.slice(0, 4);
  // Salario de los días trabajados del último mes
  const inicioMes = fin.slice(0, 8) + '01';
  const desdeMes = e.inicioContrato > inicioMes ? e.inicioContrato : inicioMes;
  const diasMes = diasEntre(desdeMes, fin);
  const diasDelMes = new Date(Date.UTC(+y, +fin.slice(5, 7), 0)).getUTCDate();
  const salarioMes = e.incluirSalarioMes === false ? 0 : (diasMes >= diasDelMes ? e.salarioMensual : e.salarioMensual / 30 * Math.min(30, diasMes));
  // Vacaciones generadas en el año natural
  const inicioAnio = `${y}-01-01`;
  const desdeVac = e.inicioContrato > inicioAnio ? e.inicioContrato : inicioAnio;
  const diasAnio = diasEntre(desdeVac, fin);
  const vacAnuales = e.diasVacacionesAnuales ?? L.vacaciones.dias_naturales_minimos;
  const generadas = vacAnuales * diasAnio / (+y % 4 === 0 ? 366 : 365);
  const pendientes = pos(generadas - e.vacacionesDisfrutadas);
  const importeVac = pendientes * diario;
  // Pagas extra devengadas y no cobradas
  const extras: { nombre: string; desde: string; dias: number; importe: number }[] = [];
  if (e.pagas === 14) {
    const mes = +fin.slice(5, 7);
    const periodos = e.devengoExtras === 'anual'
      ? [{ nombre: 'verano', desde: mes >= 7 ? `${y}-07-01` : `${+y - 1}-07-01` }, { nombre: 'navidad', desde: `${y}-01-01` }]
      : [{ nombre: mes <= 6 ? 'verano' : 'navidad', desde: mes <= 6 ? `${y}-01-01` : `${y}-07-01` }];
    const span = e.devengoExtras === 'anual' ? 365 : (mes <= 6 ? diasEntre(`${y}-01-01`, `${y}-06-30`) : diasEntre(`${y}-07-01`, `${y}-12-31`));
    for (const p of periodos) {
      const desde = e.inicioContrato > p.desde ? e.inicioContrato : p.desde;
      const dias = clamp(diasEntre(desde, fin), 0, span);
      extras.push({ nombre: p.nombre, desde, dias, importe: r2(e.salarioMensual * dias / span) });
    }
  }
  const totalExtras = extras.reduce((a, b) => a + b.importe, 0);
  return {
    diario: r2(diario),
    diasMes,
    salarioMes: r2(salarioMes),
    vacacionesGeneradas: r2(generadas),
    vacacionesPendientes: r2(pendientes),
    importeVacaciones: r2(importeVac),
    extras,
    totalExtras: r2(totalExtras),
    total: r2(salarioMes + importeVac + totalExtras),
  };
}

/* ---------------------------------------------------------------- Prestación por desempleo */
export function paro(e: { diasCotizados: number; baseMensual: number; hijos: number; parcialPct?: number }, L: any) {
  const D = L.desempleo;
  const fila = D.duracion.find((f: any) => e.diasCotizados >= f.cotizados_desde_dias && (f.cotizados_hasta_dias == null || e.diasCotizados <= f.cotizados_hasta_dias));
  const duracion = fila ? fila.prestacion_dias : 0;
  const br = Math.min(e.baseMensual, L.cotizacion.base_max_mensual) / 30; // base reguladora diaria
  const coef = (e.parcialPct ?? 100) / 100;
  const min = (e.hijos > 0 ? D.tope_min_con_hijos : D.tope_min_sin_hijos) * coef;
  const max = (e.hijos >= 2 ? D.tope_max_2_o_mas : e.hijos === 1 ? D.tope_max_1_hijo : D.tope_max_sin_hijos) * coef;
  const periodos = D.porcentajes.map((p: any) => {
    const hasta = Math.min(p.hasta_dia ?? duracion, duracion);
    const dias = pos(hasta - p.desde_dia + 1);
    const mensualBruto = clamp(br * 30 * p.pct / 100, min, max);
    const descuento = br * 30 * D.cotizacion_trabajador_descuento_pct / 100;
    return { desde: p.desde_dia, hasta, dias, pct: p.pct, mensualBruto: r2(mensualBruto), mensualNeto: r2(mensualBruto - descuento), total: r2(mensualBruto / 30 * dias) };
  }).filter((p: any) => p.dias > 0);
  const total = periodos.reduce((a: number, b: any) => a + b.total, 0);
  return { duracion, baseReguladoraDiaria: r2(br), min: r2(min), max: r2(max), periodos, total: r2(total), derecho: duracion > 0 };
}

export function subsidio(e: { meses: number; mayor52: boolean; parcialPct?: number }, L: any) {
  const S = L.desempleo.subsidio;
  const iprem = L.iprem.mensual;
  // Desde el RDL 8/2019 el subsidio de mayores de 52 años se cobra entero aunque se viniera de tiempo parcial
  const coef = e.mayor52 ? 1 : (e.parcialPct ?? 100) / 100;
  const filas: { mes: number; importe: number }[] = [];
  for (let m = 1; m <= e.meses; m++) {
    let pct = S.mayores_52_pct_iprem ?? 80;
    if (!e.mayor52) {
      const t = S.tramos.find((t: any) => m >= t.desde_mes && (t.hasta_mes == null || m <= t.hasta_mes));
      pct = t ? t.pct_iprem : 80;
    }
    filas.push({ mes: m, importe: r2(iprem * pct / 100 * coef) });
  }
  return { filas, total: r2(filas.reduce((a, b) => a + b.importe, 0)), iprem };
}

/* ---------------------------------------------------------------- Incapacidad temporal */
export function bajaIT(e: { baseMensual: number; dias: number; tipo: 'comun' | 'profesional'; complementoPct?: number }, L: any) {
  const tramos = L.incapacidad_temporal[e.tipo];
  const br = e.baseMensual / 30;
  let total = 0, empresa = 0, ss = 0, sinPrestacion = 0;
  const filas: { desde: number; hasta: number; pct: number; diario: number; importe: number }[] = [];
  for (const t of tramos) {
    const hasta = Math.min(t.hasta_dia, e.dias);
    if (hasta < t.desde_dia) continue;
    const dias = hasta - t.desde_dia + 1;
    const diario = br * t.pct / 100;
    filas.push({ desde: t.desde_dia, hasta, pct: t.pct, diario: r2(diario), importe: r2(diario * dias) });
    total += diario * dias;
    if (t.pct === 0) sinPrestacion += dias;
    if (e.tipo === 'comun') {
      for (let d = t.desde_dia; d <= hasta; d++) if (d >= 4 && d <= 15) empresa += diario; else if (d > 15) ss += diario;
    } else ss += diario * dias;
  }
  const pctObj = e.complementoPct ?? 0;
  const complemento = pctObj > 0 ? pos(br * pctObj / 100 * e.dias - total) : 0;
  return { baseDiaria: r2(br), filas, prestacion: r2(total), pagaEmpresa: r2(empresa), pagaSS: r2(ss), complemento: r2(complemento), totalConComplemento: r2(total + complemento), sinPrestacion, perdida: r2(br * e.dias - total - complemento) };
}

/* ---------------------------------------------------------------- Jubilación */
// Calendario transitorio de la Ley 27/2011 (DT 7.ª LGSS): [año, cotización exigida para 65 (meses), edad si no (meses)]
const CALENDARIO: [number, number, number][] = [
  [2013, 35 * 12 + 3, 65 * 12 + 1], [2014, 35 * 12 + 6, 65 * 12 + 2], [2015, 35 * 12 + 9, 65 * 12 + 3], [2016, 36 * 12, 65 * 12 + 4],
  [2017, 36 * 12 + 3, 65 * 12 + 5], [2018, 36 * 12 + 6, 65 * 12 + 6], [2019, 36 * 12 + 9, 65 * 12 + 8], [2020, 37 * 12, 65 * 12 + 10],
  [2021, 37 * 12 + 3, 66 * 12], [2022, 37 * 12 + 6, 66 * 12 + 2], [2023, 37 * 12 + 9, 66 * 12 + 4], [2024, 38 * 12, 66 * 12 + 6],
  [2025, 38 * 12 + 3, 66 * 12 + 8], [2026, 38 * 12 + 3, 66 * 12 + 10], [2027, 38 * 12 + 6, 67 * 12],
];
export function requisitoAnio(anio: number): { cotizacion: number; edad: number } {
  const f = CALENDARIO.find((c) => c[0] === anio) ?? (anio > 2027 ? CALENDARIO[CALENDARIO.length - 1] : CALENDARIO[0]);
  return { cotizacion: f[1], edad: f[2] };
}

export function jubilacion(e: { nacimiento: string; cotizadoMeses: number; fechaCotizado: string; sigueCotizando: boolean }) {
  const cotizadoEn = (fecha: string) => e.cotizadoMeses + (e.sigueCotizando ? Math.max(0, mesesIniciados(e.fechaCotizado, fecha) - 1) : 0);
  const a65 = sumarMeses(e.nacimiento, 65 * 12);
  let edadMeses = 67 * 12;
  let fecha = sumarMeses(e.nacimiento, edadMeses);
  const req65 = requisitoAnio(+a65.slice(0, 4));
  if (cotizadoEn(a65) >= req65.cotizacion) { edadMeses = 65 * 12; fecha = a65; }
  else {
    for (let m = 65 * 12 + 1; m <= 67 * 12; m++) {
      const f = sumarMeses(e.nacimiento, m);
      if (requisitoAnio(+f.slice(0, 4)).edad <= m) { edadMeses = m; fecha = f; break; }
    }
  }
  const cotizadoAlJubilarse = cotizadoEn(fecha);
  // Anticipada voluntaria: hasta 2 años antes con 35 años cotizados; involuntaria: 4 años antes con 33
  const voluntaria = sumarMeses(e.nacimiento, edadMeses - 24);
  const involuntaria = sumarMeses(e.nacimiento, edadMeses - 48);
  return {
    edadAnios: Math.floor(edadMeses / 12), edadMeses: edadMeses % 12, fecha, cotizadoAlJubilarse,
    voluntaria: { fecha: voluntaria, cumple: cotizadoEn(voluntaria) >= 35 * 12 },
    involuntaria: { fecha: involuntaria, cumple: cotizadoEn(involuntaria) >= 33 * 12 },
    minimo: cotizadoAlJubilarse >= 15 * 12,
  };
}

export function porcentajePension(mesesCotizados: number, L: any): number {
  const J = L.jubilacion.escala_porcentaje;
  if (mesesCotizados < 15 * 12) return 0;
  let pct = J.base_15_anos_pct;
  let resto = mesesCotizados - 15 * 12;
  for (const t of J.tramos) {
    const m = Math.min(resto, t.meses);
    pct += m * t.pct_por_mes;
    resto -= m;
    if (resto <= 0) break;
  }
  return r2(Math.min(100, pct));
}

/* ---------------------------------------------------------------- Autónomos */
export function cuotaAutonomos(e: { rendimientoAnual: number; societario?: boolean; tarifaPlana?: boolean }, L: any) {
  const A = L.autonomos;
  const pctGastos = e.societario ? A.deduccion_gastos_genericos_societarios_pct : A.deduccion_gastos_genericos_pct;
  const computableAnual = e.rendimientoAnual * (1 - pctGastos / 100);
  const mensual = computableAnual / 12;
  const tramos = A.tramos;
  const idx = tramos.findIndex((t: any) => mensual <= (t.rend_max ?? Infinity));
  const tramo = tramos[idx < 0 ? tramos.length - 1 : idx];
  const tipo = A.tipo_total_pct;
  const cuotaMin = tramo.base_min * tipo / 100;
  const cuota = e.tarifaPlana ? A.tarifa_plana_euros : cuotaMin;
  return {
    computableMensual: r2(mensual), tramo: (idx < 0 ? tramos.length - 1 : idx) + 1, baseMin: tramo.base_min, baseMax: tramo.base_max,
    tipo, cuotaMin: r2(cuotaMin), cuotaMax: r2(tramo.base_max * tipo / 100), cuota: r2(cuota), anual: r2(cuota * 12), pctGastos,
  };
}

/** Neto de un autónomo persona física en estimación directa simplificada. */
export function netoAutonomo(e: { ingresos: number; gastos: number; ccaa: string; tarifaPlana?: boolean } & Familia, P: { laboral: any; fiscal: any }) {
  const L = P.laboral, F = P.fiscal;
  const rendPrevio = pos(e.ingresos - e.gastos);
  const cuota = cuotaAutonomos({ rendimientoAnual: rendPrevio, tarifaPlana: e.tarifaPlana }, L);
  const rendNeto = pos(rendPrevio - cuota.anual);
  const pctDJ = F.estimacion_directa_simplificada?.gastos_dificil_justificacion_pct ?? 5;
  const limDJ = F.estimacion_directa_simplificada?.limite_euros ?? 2000;
  const dificil = Math.min(rendNeto * pctDJ / 100, limDJ);
  const base = pos(rendNeto - dificil);
  const irpf = cuotaAnual({ ...e, baseGeneral: base, ccaa: e.ccaa }, F);
  const neto = rendPrevio - cuota.anual - irpf.total;
  return { rendPrevio: r2(rendPrevio), cuota, rendNeto: r2(rendNeto), dificil: r2(dificil), base: r2(base), irpf, netoAnual: r2(neto), netoMensual: r2(neto / 12) };
}

export { sumarDias, cuotaEscala };
