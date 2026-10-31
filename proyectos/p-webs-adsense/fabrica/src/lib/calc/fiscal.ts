// Motores fiscales: IVA, factura, modelos trimestrales, recargos, intereses, ahorro, alquiler, dietas,
// Verifactu y obligación de declarar. F = fiscal.json del año.
import { r2, pos, diasEntre, mesesCompletos, sumarMeses, sumarDias, cuotaEscala } from './base';
import { cuotaAnual, escalaAhorroTotal, cuotaAhorro, type Familia } from './irpf';
import { cotizacion } from './ss';
import { netoAutonomo, sueldoNeto } from './laboral';

export function iva(e: { importe: number; tipo: number; modo: 'anadir' | 'quitar' }) {
  if (e.modo === 'anadir') {
    const cuota = e.importe * e.tipo / 100;
    return { base: r2(e.importe), cuota: r2(cuota), total: r2(e.importe + cuota) };
  }
  const base = e.importe / (1 + e.tipo / 100);
  return { base: r2(base), cuota: r2(e.importe - base), total: r2(e.importe) };
}

export function factura(e: { base: number; tipoIva: number; retencion: number; recargo: boolean }, F: any) {
  const cuotaIva = e.base * e.tipoIva / 100;
  const re = e.recargo ? e.base * (F.iva.recargo_equivalencia[String(e.tipoIva)] ?? 0) / 100 : 0;
  const ret = e.base * e.retencion / 100;
  return { base: r2(e.base), cuotaIva: r2(cuotaIva), recargo: r2(re), retencion: r2(ret), total: r2(e.base + cuotaIva + re - ret), tipoRe: e.recargo ? F.iva.recargo_equivalencia[String(e.tipoIva)] ?? 0 : 0 };
}

/** Base a partir del total a cobrar (factura inversa). */
export function facturaInversa(e: { total: number; tipoIva: number; retencion: number; recargo: boolean }, F: any) {
  const re = e.recargo ? F.iva.recargo_equivalencia[String(e.tipoIva)] ?? 0 : 0;
  const base = e.total / (1 + (e.tipoIva + re - e.retencion) / 100);
  return factura({ base, tipoIva: e.tipoIva, retencion: e.retencion, recargo: e.recargo }, F);
}

export function modelo303(e: { ventas: { base: number; tipo: number }[]; soportado: number; compensar: number; trimestre: number }) {
  const devengado = e.ventas.reduce((a, v) => a + v.base * v.tipo / 100, 0);
  const resultado = devengado - e.soportado - e.compensar;
  return { devengado: r2(devengado), soportado: r2(e.soportado), compensar: r2(e.compensar), resultado: r2(resultado), aIngresar: r2(pos(resultado)), aCompensar: r2(pos(-resultado)), devolucion: e.trimestre === 4 && resultado < 0 };
}

export function minoracion130(rendAnterior: number, F?: any): number {
  // Tramos de params (modelos.130.minoracion, art. 110.3.c RIRPF); los de siempre si el año no los trae
  const t: { hasta: number; euros: number }[] | undefined = F?.modelos?.['130']?.minoracion?.tramos;
  if (t) return t.find((x) => rendAnterior <= x.hasta)?.euros ?? 0;
  if (rendAnterior <= 9000) return 100;
  if (rendAnterior <= 10000) return 75;
  if (rendAnterior <= 11000) return 50;
  if (rendAnterior <= 12000) return 25;
  return 0;
}

export function modelo130(e: { ingresosAcum: number; gastosAcum: number; retencionesAcum: number; pagosAnteriores: number; trimestre: number; rendAnterior: number; vivienda?: boolean }, F: any) {
  const pct = F.modelos?.['130']?.pct ?? 20;
  const rend = e.ingresosAcum - e.gastosAcum;
  const pago = pos(rend) * pct / 100;
  const minor = minoracion130(e.rendAnterior, F) * e.trimestre;
  const resultado = pago - e.retencionesAcum - e.pagosAnteriores - minor;
  return { rend: r2(rend), pct, pago: r2(pago), minoracion: r2(minor), resultado: r2(resultado), aIngresar: r2(pos(resultado)) };
}

/** Recargo por presentación fuera de plazo sin requerimiento (art. 27 Ley General Tributaria). */
export function recargoExtemporaneo(e: { cuota: number; finPlazo: string; presentacion: string; reduccion: boolean }, F: any) {
  const R = F.recargos_extemporaneos ?? { pct_por_mes: 1, despues_12_meses_pct: 15 };
  const desde = sumarDias(e.finPlazo, 1);
  const meses = mesesCompletos(desde, e.presentacion);
  let pct: number, intereses = 0, diasInt = 0;
  if (meses < 12) pct = 1 + meses * R.pct_por_mes;
  else {
    pct = R.despues_12_meses_pct;
    const inicioInt = sumarMeses(desde, 12);
    diasInt = pos(diasEntre(inicioInt, e.presentacion));
    intereses = e.cuota * (F.interes_demora_pct / 100) * diasInt / 365;
  }
  let recargo = e.cuota * pct / 100;
  const red = e.reduccion ? recargo * 0.25 : 0;
  recargo -= red;
  return { mesesRetraso: meses, pct, recargoBruto: r2(recargo + red), reduccion: r2(red), recargo: r2(recargo), diasIntereses: diasInt, intereses: r2(intereses), total: r2(e.cuota + recargo + intereses) };
}

export function interesesDemora(e: { importe: number; desde: string; hasta: string; tipo?: number }, F: any) {
  const tipo = e.tipo ?? F.interes_demora_pct;
  const dias = pos(diasEntre(e.desde, e.hasta) - 1);
  return { dias, tipo, intereses: r2(e.importe * tipo / 100 * dias / 365) };
}

export function gananciaPatrimonial(e: { compra: number; gastosCompra: number; venta: number; gastosVenta: number }, F: any) {
  const ganancia = (e.venta - e.gastosVenta) - (e.compra + e.gastosCompra);
  const cuota = ganancia > 0 ? cuotaAhorro(ganancia, F) : 0;
  return { ganancia: r2(ganancia), cuota: r2(cuota), tipoMedio: ganancia > 0 ? r2(cuota / ganancia * 100) : 0, neto: r2(ganancia - cuota), escala: escalaAhorroTotal(F) };
}

export function interesesDeposito(e: { capital: number; tin: number; meses: number }, F: any) {
  const bruto = e.capital * e.tin / 100 * e.meses / 12;
  const ret = bruto * (F.irpf.retenciones.capital_mobiliario_pct ?? 19) / 100;
  const cuota = cuotaAhorro(bruto, F);
  return { bruto: r2(bruto), retencion: r2(ret), neto: r2(bruto - ret), cuotaFinal: r2(cuota), diferencia: r2(cuota - ret) };
}

export function alquilerIRPF(e: { ingresos: number; gastos: number; amortizacion: number; reduccionPct: number; otraBase: number; ccaa: string } & Familia, F: any) {
  const rend = e.ingresos - e.gastos - e.amortizacion;
  const reduccion = rend > 0 ? rend * e.reduccionPct / 100 : 0;
  const reducido = rend - reduccion;
  const sin = cuotaAnual({ ...e, baseGeneral: e.otraBase, ccaa: e.ccaa }, F);
  const con = cuotaAnual({ ...e, baseGeneral: pos(e.otraBase + reducido), ccaa: e.ccaa }, F);
  return { rend: r2(rend), reduccion: r2(reduccion), reducido: r2(reducido), impuestoExtra: r2(con.total - sin.total), tipoEfectivo: rend > 0 ? r2((con.total - sin.total) / rend * 100) : 0 };
}

export function dietas(e: { diasPernocta: number; diasSinPernocta: number; extranjero: boolean; km: number; pagado: number }, F: any) {
  const D = F.dietas_exentas;
  const z = e.extranjero ? D.extranjero : D.espana;
  const exentoDietas = e.diasPernocta * z.pernocta + e.diasSinPernocta * z.sin_pernocta;
  const exentoKm = e.km * D.km_euros;
  const maximo = exentoDietas + exentoKm;
  const exento = Math.min(e.pagado, maximo);
  return { exentoDietas: r2(exentoDietas), exentoKm: r2(exentoKm), maximo: r2(maximo), exento: r2(exento), tributa: r2(pos(e.pagado - maximo)) };
}

export function verifactu(e: { tipo: 'sociedad' | 'autonomo' | 'otros'; sii: boolean; foral: boolean; sinFacturas: boolean }, F: any) {
  const V = F.verifactu;
  if (e.foral) return { obligado: false, motivo: 'foral', fecha: null as string | null };
  if (e.sii) return { obligado: false, motivo: 'sii', fecha: null };
  if (e.sinFacturas) return { obligado: false, motivo: 'sinFacturas', fecha: null };
  const fecha = e.tipo === 'sociedad' ? V.sociedades_desde : V.resto_desde;
  return { obligado: true, motivo: e.tipo, fecha };
}

export function obligacionDeclarar(e: { trabajo: number; pagadores: number; segundoPagador: number; capital: number; ganancias: number; gananciasSinRetencion?: number; inmobiliarias: number; actividad: boolean; alquiler: number }, F: any) {
  const RT = F.irpf.rendimientos_trabajo;
  const razones: string[] = [];
  if (e.actividad) razones.push('actividad');
  const lim1 = RT.obligacion_declarar_un_pagador;
  const lim2 = RT.obligacion_declarar_varios_pagadores;
  const varios = e.pagadores > 1 && e.segundoPagador > 1500;
  if (e.trabajo > (varios ? lim2 : lim1)) razones.push(varios ? 'trabajoVarios' : 'trabajo');
  if (e.capital + e.ganancias > 1600) razones.push('capital');
  // Imputaciones inmobiliarias y ganancias sin retención (acciones, cripto) comparten el límite de 1.000 € (art. 96.2.c LIRPF)
  if (e.inmobiliarias + (e.gananciasSinRetencion ?? 0) > 1000) razones.push('inmobiliarias');
  if (e.alquiler > 0) razones.push('alquiler');
  return { obligado: razones.length > 0, razones, lim1, lim2 };
}

export function tipoMarginalIRPF(e: { base: number; ccaa: string }, F: any) {
  const c = cuotaAnual({ baseGeneral: e.base, ccaa: e.ccaa }, F);
  const c100 = cuotaAnual({ baseGeneral: e.base + 100, ccaa: e.ccaa }, F);
  return { ...c, extraPor100: r2(c100.total - c.total) };
}

export function precioHora(e: { netoMensual: number; horasMes: number; gastosMensuales: number; ccaa: string; tarifaPlana?: boolean }, P: { laboral: any; fiscal: any }) {
  const objetivo = e.netoMensual * 12;
  let lo = 0, hi = objetivo * 3 + e.gastosMensuales * 12 + 20000;
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2;
    const r = netoAutonomo({ ingresos: mid, gastos: e.gastosMensuales * 12, ccaa: e.ccaa, tarifaPlana: e.tarifaPlana }, P);
    if (r.netoAnual < objetivo) lo = mid; else hi = mid;
  }
  const r = netoAutonomo({ ingresos: hi, gastos: e.gastosMensuales * 12, ccaa: e.ccaa, tarifaPlana: e.tarifaPlana }, P);
  return { facturacionAnual: r2(hi), facturacionMensual: r2(hi / 12), precioHora: r2(hi / 12 / Math.max(1, e.horasMes)), detalle: r };
}

/** Compara el mismo coste total como asalariado (coste empresa) o como autónomo (facturación sin IVA). */
export function autonomoVsAsalariado(e: { coste: number; gastosAutonomo: number; ccaa: string; pagas: 12 | 14; tarifaPlana?: boolean }, P: { laboral: any; fiscal: any }) {
  let lo = 0, hi = e.coste;
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2;
    const ce = mid + cotizacion({ brutoAnual: mid }, P.laboral).empresa.anual;
    if (ce < e.coste) lo = mid; else hi = mid;
  }
  const asal = sueldoNeto({ brutoAnual: lo, pagas: e.pagas, ccaa: e.ccaa }, P);
  const auto = netoAutonomo({ ingresos: e.coste, gastos: e.gastosAutonomo, ccaa: e.ccaa, tarifaPlana: e.tarifaPlana }, P);
  return { brutoAsalariado: r2(lo), asalariado: asal, autonomo: auto, diferencia: r2(auto.netoAnual - (asal.netoAnual - (asal.renta?.diferencia ?? 0))) };
}

export { cuotaEscala };
