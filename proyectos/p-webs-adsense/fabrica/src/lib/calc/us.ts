// Motor de impuestos y finanzas personales de EE. UU. Funciones puras: todas las cifras legales llegan en P
// (params/us/<año>/laboral.json y fiscal.json). Simplificaciones declaradas en cada calculadora.
import type { Bloques } from '../params';
import { cuotaEscala, tipoMarginal, r2, pos, type Tramo } from './base';

export type EstadoCivil = 'single' | 'mfj' | 'hoh' | 'mfs';
export const ESTADOS_CIVILES: EstadoCivil[] = ['single', 'mfj', 'hoh', 'mfs'];
export const estadoCivil = (v: unknown): EstadoCivil => (ESTADOS_CIVILES.includes(v as EstadoCivil) ? (v as EstadoCivil) : 'single');

/** Valor de un objeto por estado civil, con alias (p. ej. hoh → mfj) y soltero como último recurso. */
function porEstado<X>(o: Partial<Record<EstadoCivil, X>> | undefined, ec: EstadoCivil, alias?: Partial<Record<EstadoCivil, EstadoCivil>>): X | undefined {
  if (!o) return undefined;
  return o[ec] ?? (alias?.[ec] ? o[alias[ec]!] : undefined) ?? o.single;
}

/* ---------------- Impuesto federal sobre la renta ---------------- */

export const tramosFederales = (ec: EstadoCivil, F: any): Tramo[] => F.federal.tramos[ec];
export const deduccionEstandar = (ec: EstadoCivil, F: any): number => F.federal.deduccion_estandar[ec];

/** Impuesto de la escala federal sobre la renta imponible (Form 1040, línea 16, sin ganancias de capital). */
export function impuestoEscala(imponible: number, ec: EstadoCivil, F: any): { impuesto: number; marginal: number } {
  const t = tramosFederales(ec, F);
  return { impuesto: r2(cuotaEscala(pos(imponible), t)), marginal: tipoMarginal(pos(imponible), t) };
}

/* ---------------- FICA y trabajo por cuenta propia ---------------- */

/** Seguro Social y Medicare del empleado sobre el salario anual sujeto a FICA. */
export function fica(salario: number, L: any) {
  const f = L.fica;
  const ss = r2(Math.min(pos(salario), f.tope_salarial) * f.seguro_social_pct / 100);
  const medicare = r2(pos(salario) * f.medicare_pct / 100);
  // El empleador retiene el 0,9 % adicional sobre lo que pase de 200.000 $, sin mirar el estado civil
  const adicional = r2(pos(salario - f.umbral_retencion_adicional) * f.medicare_adicional_pct / 100);
  return { ss, medicare, adicional, total: r2(ss + medicare + adicional) };
}

/** Impuesto de trabajo por cuenta propia (Schedule SE). salariosW2 reduce el tope del Seguro Social. */
export function impuestoAutonomo(ganancia: number, L: any, salariosW2 = 0) {
  const a = L.autonomos, f = L.fica;
  const base = r2(pos(ganancia) * a.base_pct / 100);
  if (base < a.minimo_ganancia || ganancia < a.minimo_ganancia) return { base, ss: 0, medicare: 0, total: 0, deducible: 0 };
  const topeRestante = pos(f.tope_salarial - salariosW2);
  const ss = r2(Math.min(base, topeRestante) * a.seguro_social_pct / 100);
  const medicare = r2(base * a.medicare_pct / 100);
  const total = r2(ss + medicare);
  return { base, ss, medicare, total, deducible: r2(total * a.deducible_pct / 100) };
}

/** 0,9 % adicional de Medicare en la declaración (Form 8959), con el umbral de cada estado civil. */
export function medicareAdicional(salarios: number, baseAutonomo: number, ec: EstadoCivil, L: any): number {
  const f = L.fica;
  return r2(pos(salarios + baseAutonomo - f.umbrales_adicional[ec]) * f.medicare_adicional_pct / 100);
}

/* ---------------- Créditos y deducciones ---------------- */

/** Crédito tributario por hijos (CTC) y por otros dependientes, con la parte reembolsable (ACTC). */
export function creditoHijos(e: { hijos: number; otros?: number; agi: number; ingresoGanado: number; impuesto: number; ec: EstadoCivil }, F: any) {
  const c = F.credito_hijos;
  const hijos = Math.max(0, Math.floor(e.hijos)), otros = Math.max(0, Math.floor(e.otros ?? 0));
  const bruto = hijos * c.por_hijo + otros * c.otros_dependientes;
  const exceso = pos(e.agi - c.umbral_reduccion[e.ec]);
  const reduccion = Math.ceil(exceso / 1000) * c.reduccion_por_1000;
  const potencial = pos(bruto - reduccion);
  const noReembolsable = Math.min(potencial, pos(e.impuesto));
  // La parte reembolsable solo sale de los hijos (no de otros dependientes)
  const restanteHijos = pos(Math.min(potencial, hijos * c.por_hijo) - noReembolsable);
  const reembolsable = r2(Math.min(restanteHijos, hijos * c.reembolsable_max, pos(e.ingresoGanado - c.umbral_ingreso_ganado) * c.pct_reembolsable / 100));
  return { bruto, reduccion, potencial, noReembolsable: r2(noReembolsable), reembolsable, total: r2(noReembolsable + reembolsable) };
}

const vigente = (d: any, anio: number) => anio >= d.desde && anio <= d.hasta;

/** Deducción por propinas o por horas extra de la ley OBBBA (2025–2028), con tope y reducción por ingresos. */
export function deduccionObbba(tipo: 'propinas' | 'horas_extra' | 'intereses_auto', importe: number, magi: number, ec: EstadoCivil, F: any, anio: number) {
  const o = F.obbba;
  const d = o[tipo];
  if (!d || !vigente(d, anio)) return { deduccion: 0, tope: 0, reduccion: 0, excluido: false, vigente: false };
  if (ec === 'mfs' && o.mfs_excluido && tipo !== 'intereses_auto') return { deduccion: 0, tope: 0, reduccion: 0, excluido: true, vigente: true };
  const tope = ec === 'mfj' && d.max_mfj ? d.max_mfj : d.max;
  const umbral = porEstado(d.umbral, ec) as number;
  const reduccion = Math.ceil(pos(magi - umbral) / 1000) * d.reduccion_por_1000;
  const deduccion = r2(pos(Math.min(pos(importe), tope) - reduccion));
  return { deduccion, tope, reduccion, excluido: false, vigente: true };
}

/* ---------------- Declaración federal anual ---------------- */

export interface EntradaFederal {
  ec: EstadoCivil;
  salarios?: number; // salario W-2 (casilla 1), ya sin aportes antes de impuestos
  gananciaAutonomo?: number; // ganancia neta del Schedule C (1099)
  otrosIngresos?: number; // intereses, desempleo… (tributan al tipo ordinario)
  ajustes?: number; // aportes a IRA deducibles, intereses de préstamo estudiantil…
  deduccionDetallada?: number; // 0 = deducción estándar
  propinas?: number; // propinas calificadas incluidas en salarios
  primaHorasExtra?: number; // la «media» del tiempo y medio, incluida en salarios
  hijos?: number;
  otrosDependientes?: number;
  retenido?: number; // impuesto federal retenido (W-2 casilla 2) y pagos estimados
  anio: number;
}

export function impuestoFederal(e: EntradaFederal, P: Bloques) {
  const F = P.fiscal, L = P.laboral;
  const salarios = pos(e.salarios ?? 0), gan = e.gananciaAutonomo ?? 0, otros = pos(e.otrosIngresos ?? 0);
  const se = impuestoAutonomo(gan, L, salarios);
  const ingresoTotal = r2(salarios + gan + otros);
  const agi = r2(pos(ingresoTotal - se.deducible - pos(e.ajustes ?? 0)));
  const std = deduccionEstandar(e.ec, F);
  const detallada = pos(e.deduccionDetallada ?? 0);
  const deduccion = Math.max(std, detallada);
  const prop = deduccionObbba('propinas', e.propinas ?? 0, agi, e.ec, F, e.anio);
  const he = deduccionObbba('horas_extra', e.primaHorasExtra ?? 0, agi, e.ec, F, e.anio);
  const antesQbi = pos(agi - deduccion - prop.deduccion - he.deduccion);
  // QBI (sección 199A) solo por debajo del umbral, donde es el 20 % del menor de QBI e imponible
  const qbiBase = pos(gan - se.deducible);
  const q = F.qbi;
  const qbi = qbiBase > 0 && antesQbi <= q.umbral[e.ec] ? r2(Math.min(qbiBase, antesQbi) * q.pct / 100) : 0;
  const imponible = r2(pos(antesQbi - qbi));
  const esc = impuestoEscala(imponible, e.ec, F);
  const ctc = creditoHijos({ hijos: e.hijos ?? 0, otros: e.otrosDependientes ?? 0, agi, ingresoGanado: salarios + pos(gan - se.deducible), impuesto: esc.impuesto, ec: e.ec }, F);
  const adicional = medicareAdicional(salarios, se.base, e.ec, L);
  // El 0,9 % retenido por el empleador sobre el salario de más de 200.000 $ se descuenta como pago
  const adicionalRetenido = fica(salarios, L).adicional;
  const impuestoRenta = r2(pos(esc.impuesto - ctc.noReembolsable));
  const impuestoTotal = r2(impuestoRenta + se.total + adicional);
  const pagos = r2(pos(e.retenido ?? 0) + ctc.reembolsable + adicionalRetenido);
  const resultado = r2(pagos - impuestoTotal); // > 0 reembolso, < 0 a pagar
  return {
    ingresoTotal, agi, deduccion, usaEstandar: deduccion === std, deduccionEstandar: std,
    propinas: prop, horasExtra: he, qbi, imponible,
    impuestoEscala: esc.impuesto, marginal: esc.marginal,
    ctc, se, medicareAdicional: adicional, impuestoRenta, impuestoTotal,
    tipoEfectivo: ingresoTotal > 0 ? r2((impuestoTotal / ingresoTotal) * 100) : 0,
    tipoEfectivoRenta: ingresoTotal > 0 ? r2((impuestoRenta / ingresoTotal) * 100) : 0,
    pagos, resultado,
  };
}

/* ---------------- Retención federal en el cheque (W-4 de 2020 en adelante) ---------------- */

export interface EntradaW4 {
  salarioAnual: number; // salario sujeto a retención (ya sin 401(k) ni seguro médico antes de impuestos)
  ec: EstadoCivil; // en el W-4: single (o casado por separado), mfj o hoh
  paso2?: boolean; // casilla del paso 2: dos trabajos
  paso3?: number; // créditos por dependientes del paso 3 (importe anual)
  otrosIngresos4a?: number;
  deducciones4b?: number;
  extra4c?: number; // retención adicional por periodo
  periodos: number;
}

/** Método de porcentaje anual de la Pub. 15-T simplificado: escala del año sobre el salario menos la
 * deducción estándar (con la casilla del paso 2, la mitad de la escala y de la deducción). */
export function retencionFederal(e: EntradaW4, F: any) {
  const ec: EstadoCivil = e.ec === 'mfs' ? 'single' : e.ec;
  const div = e.paso2 ? 2 : 1;
  const tramos = tramosFederales(ec, F).map((t) => ({ hasta: t.hasta == null ? null : t.hasta / div, tipo: t.tipo }));
  const base = pos(e.salarioAnual + pos(e.otrosIngresos4a ?? 0) - pos(e.deducciones4b ?? 0) - deduccionEstandar(ec, F) / div);
  const bruta = cuotaEscala(base, tramos);
  const anual = r2(pos(bruta - pos(e.paso3 ?? 0)));
  const porPeriodo = r2(anual / e.periodos + pos(e.extra4c ?? 0));
  return { base: r2(base), anual: r2(porPeriodo * e.periodos), porPeriodo, marginal: tipoMarginal(base, tramos) };
}

/* ---------------- Impuesto estatal ---------------- */

export const estadosConDatos = (F: any): string[] => Object.keys(F.estados);
export const sinImpuestoEstatal = (est: string, F: any) => F.estados[est]?.tipo === 'ninguno';

export interface EntradaEstatal {
  estado: string;
  ec: EstadoCivil;
  agi: number; // ingreso bruto ajustado federal
  salarioBruto?: number; // para estados que gravan la compensación bruta (PA)
  imponibleFederal?: number; // para estados que parten de la renta imponible federal (CO)
  dependientes?: number;
}

export function impuestoEstatal(e: EntradaEstatal, F: any) {
  const d = F.estados[e.estado];
  if (!d) throw new Error(`Sin datos del estado ${e.estado}`);
  if (d.tipo === 'ninguno') return { impuesto: 0, marginal: 0, imponible: 0, efectivo: 0, deducciones: 0, creditos: 0, ninguno: true };
  const dep = Math.max(0, Math.floor(e.dependientes ?? 0));
  const base = d.base === 'federal_imponible' ? pos(e.imponibleFederal ?? 0) : d.base === 'salario_bruto' ? pos(e.salarioBruto ?? e.agi) : pos(e.agi);
  let deducciones = 0;
  if (d.deduccion_estandar === 'federal') deducciones += deduccionEstandar(e.ec, F);
  else if (d.deduccion_estandar) deducciones += porEstado(d.deduccion_estandar, e.ec) ?? 0;
  if (d.exencion_persona) deducciones += d.exencion_persona * ((e.ec === 'mfj' ? 2 : 1) + dep);
  if (d.exencion_personal) deducciones += porEstado(d.exencion_personal, e.ec) ?? 0;
  if (d.exencion_dependiente) deducciones += d.exencion_dependiente * dep;
  const imponible = r2(pos(base - deducciones));
  let bruto: number, marginal: number;
  if (d.tipo === 'plano') { bruto = imponible * d.pct / 100; marginal = imponible > 0 ? d.pct : 0; }
  else {
    const t: Tramo[] = porEstado(d.tramos, e.ec, d.tramos_alias)!;
    bruto = cuotaEscala(imponible, t); marginal = tipoMarginal(imponible, t);
  }
  if (d.sobretasa && imponible > d.sobretasa.umbral) { bruto += (imponible - d.sobretasa.umbral) * d.sobretasa.pct / 100; marginal += d.sobretasa.pct; }
  const creditos = (porEstado(d.credito_personal, e.ec) ?? 0) + (d.credito_dependiente ?? 0) * dep;
  const impuesto = r2(pos(bruto - creditos));
  return { impuesto, marginal: r2(marginal), imponible, efectivo: base > 0 ? r2((impuesto / base) * 100) : 0, deducciones: r2(deducciones), creditos: r2(Math.min(creditos, bruto)), ninguno: false };
}

/** Cotizaciones estatales del empleado (SDI, WA Cares…) sobre el salario anual. */
export function contribucionesEstatales(estado: string, salario: number, L: any) {
  const lista: any[] = L.contribuciones_estatales?.[estado] ?? [];
  return lista.map((c) => {
    let imp = pos(c.tope ? Math.min(salario, c.tope) : salario) * c.pct / 100;
    if (c.max_semanal) imp = Math.min(imp, c.max_semanal * 52);
    return { id: c.id as string, nombre: c.nombre as string, pct: c.pct as number, importe: r2(imp) };
  });
}

/* ---------------- Cheque de pago ---------------- */

export interface EntradaCheque {
  brutoAnual: number;
  periodos: number;
  ec: EstadoCivil;
  estado: string;
  paso2?: boolean;
  hijos?: number; // menores de 17 (paso 3 del W-4 y CTC)
  otrosDependientes?: number;
  pct401k?: number; // % del salario al 401(k) tradicional
  seguroMedico?: number; // prima antes de impuestos por cheque (sección 125)
  extra4c?: number;
}

export function chequePago(e: EntradaCheque, P: Bloques) {
  const F = P.fiscal, L = P.laboral;
  const per = e.periodos;
  const salud = r2(pos(e.seguroMedico ?? 0) * per);
  const aporte401k = r2(Math.min(pos(e.brutoAnual) * pos(e.pct401k ?? 0) / 100, F.jubilacion.aporte_401k));
  const salarioFica = pos(e.brutoAnual - salud);
  const salarioFederal = pos(salarioFica - aporte401k);
  const hijos = Math.max(0, Math.floor(e.hijos ?? 0)), otros = Math.max(0, Math.floor(e.otrosDependientes ?? 0));
  const paso3 = hijos * F.credito_hijos.por_hijo + otros * F.credito_hijos.otros_dependientes;
  const fed = retencionFederal({ salarioAnual: salarioFederal, ec: e.ec, paso2: e.paso2, paso3, extra4c: e.extra4c, periodos: per }, F);
  const fi = fica(salarioFica, L);
  const est = F.estados[e.estado];
  const baseEstatal = est?.deduce_401k === false ? salarioFica : salarioFederal;
  const imponibleFederal = pos(salarioFederal - deduccionEstandar(e.ec, F));
  const st = impuestoEstatal({ estado: e.estado, ec: e.ec, agi: baseEstatal, salarioBruto: baseEstatal, imponibleFederal, dependientes: hijos + otros }, F);
  const contrib = contribucionesEstatales(e.estado, salarioFica, L);
  const contribTotal = r2(contrib.reduce((s, c) => s + c.importe, 0));
  const descuentosAnuales = r2(fed.anual + fi.total + st.impuesto + contribTotal + aporte401k + salud);
  const netoAnual = r2(e.brutoAnual - descuentosAnuales);
  const pp = (n: number) => r2(n / per);
  return {
    brutoAnual: r2(e.brutoAnual), brutoPeriodo: pp(e.brutoAnual), periodos: per,
    federal: fed, fica: fi, estatal: st, contribuciones: contrib, contribTotal, aporte401k, salud,
    porPeriodo: {
      federal: fed.porPeriodo, ss: pp(fi.ss), medicare: pp(fi.medicare + fi.adicional), estatal: pp(st.impuesto), contrib: pp(contribTotal),
      k401: pp(aporte401k), salud: pp(salud), neto: pp(netoAnual),
    },
    netoAnual, descuentosAnuales,
    tipoTotal: e.brutoAnual > 0 ? r2((descuentosAnuales - aporte401k - salud) / e.brutoAnual * 100) : 0,
  };
}

/* ---------------- Trabajo por horas y horas extra ---------------- */

export function horaAAnual(tarifa: number, horasSemana: number, semanas = 52) {
  const anual = r2(tarifa * horasSemana * semanas);
  return { anual, mensual: r2(anual / 12), quincenal: r2(anual / 26), semanal: r2(tarifa * horasSemana), diario: r2(tarifa * horasSemana / 5) };
}

export function anualAHora(anual: number, horasSemana: number, semanas = 52) {
  return r2(anual / (horasSemana * semanas));
}

/** Pago de una semana con horas extra según la FLSA y, en California, por día. horasDia = horas de cada día trabajado. */
export function horasExtra(e: { tarifa: number; horasSemana: number; estado?: string; horasDia?: number[] }, L: any) {
  const h = L.horas_extra;
  const reglaDia = e.estado ? h.estados?.[e.estado] : undefined;
  let normales: number, extra: number, doble = 0;
  if (reglaDia && e.horasDia?.length) {
    let n = 0, x = 0;
    for (const d of e.horasDia) {
      n += Math.min(d, reglaDia.umbral_diario);
      x += pos(Math.min(d, reglaDia.umbral_doble) - reglaDia.umbral_diario);
      doble += pos(d - reglaDia.umbral_doble);
    }
    // Lo que pase de 40 horas normales en la semana también es extra
    const exSemana = pos(n - h.umbral_semanal);
    normales = n - exSemana; extra = x + exSemana;
  } else {
    normales = Math.min(e.horasSemana, h.umbral_semanal);
    extra = pos(e.horasSemana - h.umbral_semanal);
  }
  const pagoNormal = r2(normales * e.tarifa);
  const pagoExtra = r2(extra * e.tarifa * h.factor);
  const pagoDoble = r2(doble * e.tarifa * (reglaDia?.factor_doble ?? 2));
  const total = r2(pagoNormal + pagoExtra + pagoDoble);
  // Prima deducible con la ley OBBBA: solo la mitad del «tiempo y medio» federal (no la doble ni la diaria de CA)
  const horasExtraFederales = pos((e.horasDia?.length ? normales + extra + doble : e.horasSemana) - h.umbral_semanal);
  const prima = r2(horasExtraFederales * e.tarifa * (h.factor - 1));
  return { normales, extra, doble, pagoNormal, pagoExtra, pagoDoble, total, tarifaExtra: r2(e.tarifa * h.factor), prima };
}

/* ---------------- Finanzas personales ---------------- */

/** Cuota de un préstamo amortizable (sistema francés). tasa en % anual, n en meses. */
export function cuotaPrestamo(principal: number, tasaAnual: number, meses: number): number {
  const r = tasaAnual / 100 / 12;
  if (meses <= 0) return 0;
  if (r === 0) return r2(principal / meses);
  return r2((principal * r) / (1 - Math.pow(1 + r, -meses)));
}

export function prestamo(principal: number, tasaAnual: number, meses: number) {
  const cuota = cuotaPrestamo(principal, tasaAnual, meses);
  const r = tasaAnual / 100 / 12;
  let saldo = principal, interesPrimerAnio = 0;
  const anual: { anio: number; interes: number; capital: number; saldo: number }[] = [];
  let ai = 0, ac = 0;
  for (let m = 1; m <= meses && saldo > 0.005; m++) {
    const i = saldo * r;
    const c = Math.min(cuota - i, saldo);
    saldo -= c; ai += i; ac += c;
    if (m <= 12) interesPrimerAnio += i;
    if (m % 12 === 0 || m === meses) { anual.push({ anio: Math.ceil(m / 12), interes: r2(ai), capital: r2(ac), saldo: r2(pos(saldo)) }); ai = 0; ac = 0; }
  }
  const total = r2(cuota * meses);
  return { cuota, total, intereses: r2(total - principal), interesPrimerAnio: r2(interesPrimerAnio), anual };
}

/** Tarjeta de crédito con pago fijo mensual: meses hasta pagarla e intereses totales. */
export function tarjetaCredito(saldo: number, apr: number, pago: number) {
  const r = apr / 100 / 12;
  const interesMes1 = r2(saldo * r);
  if (pago <= saldo * r) return { meses: Infinity, intereses: Infinity, interesMes1, nuncaTermina: true, pagoMinimoUtil: r2(saldo * r + 1) };
  let s = saldo, meses = 0, intereses = 0;
  while (s > 0.005 && meses < 1200) {
    const i = s * r;
    intereses += i;
    s = s + i - pago;
    meses++;
  }
  return { meses, intereses: r2(intereses), interesMes1, nuncaTermina: false, pagoMinimoUtil: r2(saldo * r + 1) };
}

/** Pago mensual necesario para liquidar la tarjeta en n meses. */
export const pagoParaLiquidar = (saldo: number, apr: number, meses: number) => cuotaPrestamo(saldo, apr, meses);

/** Ahorro en 401(k): valor futuro con aportación del empleador (match) y ahorro fiscal al tipo marginal. */
export function ahorro401k(e: { salario: number; pct: number; matchPct: number; matchTope: number; saldo: number; rentabilidad: number; anios: number; edad: number; marginal: number; subida?: number }, F: any) {
  const j = F.jubilacion;
  const r = e.rentabilidad / 100;
  let saldo = e.saldo, aportado = 0, empresa = 0, salario = e.salario;
  const tabla: { anio: number; edad: number; aporte: number; empresa: number; saldo: number }[] = [];
  for (let a = 1; a <= e.anios; a++) {
    const edad = e.edad + a - 1;
    const limite = j.aporte_401k + (edad >= 60 && edad <= 63 ? j.recuperacion_60_63 : edad >= 50 ? j.recuperacion_50 : 0);
    const aporte = Math.min(salario * e.pct / 100, limite);
    const match = salario * Math.min(e.pct, e.matchTope) / 100 * (e.matchPct / 100);
    saldo = saldo * (1 + r) + (aporte + match) * (1 + r / 2);
    aportado += aporte; empresa += match;
    tabla.push({ anio: a, edad, aporte: r2(aporte), empresa: r2(match), saldo: r2(saldo) });
    salario *= 1 + (e.subida ?? 0) / 100;
  }
  const aporte1 = Math.min(e.salario * e.pct / 100, j.aporte_401k + (e.edad >= 60 && e.edad <= 63 ? j.recuperacion_60_63 : e.edad >= 50 ? j.recuperacion_50 : 0));
  return { saldo: r2(saldo), aportado: r2(aportado), empresa: r2(empresa), rendimiento: r2(saldo - e.saldo - aportado - empresa), aporteAnio1: r2(aporte1), ahorroFiscalAnio1: r2(aporte1 * e.marginal / 100), tabla };
}

/** Coste real de un envío de dinero: comisión, margen del tipo de cambio e impuesto del 1 % si se paga en efectivo. */
export function envioRemesa(e: { monto: number; comision: number; tasaOfrecida: number; tasaReferencia: number; efectivo: boolean }, F: any) {
  const imp = e.efectivo ? r2(e.monto * F.remesas.impuesto_pct / 100) : 0;
  const recibe = r2(e.monto * e.tasaOfrecida);
  const recibeIdeal = r2(e.monto * e.tasaReferencia);
  const costeTipo = e.tasaReferencia > 0 ? r2((recibeIdeal - recibe) / e.tasaReferencia) : 0;
  const pagaTotal = r2(e.monto + e.comision + imp);
  const costeTotal = r2(e.comision + imp + costeTipo);
  return { recibe, recibeIdeal, impuesto: imp, pagaTotal, costeTipo, costeTotal, costePct: e.monto > 0 ? r2((costeTotal / e.monto) * 100) : 0, margenPct: e.tasaReferencia > 0 ? r2((1 - e.tasaOfrecida / e.tasaReferencia) * 100) : 0 };
}

/** Conversión de divisas con margen y comisión. */
export function cambioDivisa(e: { monto: number; tasa: number; margenPct: number; comision: number }) {
  const tasaEfectiva = r2(e.tasa * (1 - e.margenPct / 100) * 10000) / 10000;
  const neto = pos(e.monto - e.comision);
  const recibe = r2(neto * tasaEfectiva);
  const sinCostes = r2(e.monto * e.tasa);
  return { tasaEfectiva, recibe, sinCostes, perdida: r2(sinCostes - recibe), perdidaUsd: e.tasa > 0 ? r2((sinCostes - recibe) / e.tasa) : 0, inversa: e.tasa > 0 ? r2((1 / e.tasa) * 10000) / 10000 : 0 };
}
