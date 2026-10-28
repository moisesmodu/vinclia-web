// IRPF: retención en nómina (procedimiento general del Reglamento del IRPF, arts. 80 a 87) y cuota anual
// estimada por comunidad autónoma (Ley 35/2006 y escalas autonómicas del año). Todas las cifras salen de
// params/<pais>/<anio>/fiscal.json.
import { cuotaEscala, tipoMarginal, sumarEscalas, r2, pos, type Tramo } from './base';

export interface Familia {
  situacion?: 1 | 2 | 3; // 1: soltero, viudo o separado con hijos a cargo exclusivo; 2: cónyuge sin rentas > 1.500 €; 3: otras
  edad?: number;
  hijos?: number;
  hijosMenores3?: number;
  hijosEnteros?: boolean; // true si el mínimo por descendientes se aplica al 100 % (un solo progenitor)
  discapacidad?: 0 | 33 | 65;
  ascendientes?: number; // ascendientes mayores de 65 que conviven
}

export function reduccionTrabajo(rnPrevio: number, F: any): number {
  const r = F.irpf.rendimientos_trabajo.reduccion;
  if (rnPrevio <= r.tramo1_hasta) return r.tramo1_importe;
  if (rnPrevio <= r.tramo2_hasta) return pos(r.tramo1_importe - r.tramo2_coef * (rnPrevio - r.tramo1_hasta));
  if (rnPrevio <= r.tramo3_hasta) return pos(r.tramo3_base - r.tramo3_coef * (rnPrevio - r.tramo2_hasta));
  return 0;
}

export function otrosGastos(F: any, fam: Familia = {}): number {
  const g = F.irpf.rendimientos_trabajo.gastos_otros_deducibles;
  // Incremento para trabajadores activos con discapacidad (art. 19.2.f LIRPF)
  const extra = fam.discapacidad === 65 ? 7750 : fam.discapacidad === 33 ? 3500 : 0;
  return g + extra;
}

export function minimoPersonalFamiliar(F: any, fam: Familia = {}, personalAutonomico?: number): { total: number; personal: number; descendientes: number; discapacidad: number; ascendientes: number } {
  const m = F.irpf.minimos;
  const edad = fam.edad ?? 40;
  let personal = personalAutonomico ?? m.personal;
  if (edad >= 65) personal += m.mayor_65;
  if (edad >= 75) personal += m.mayor_75;
  const hijos = Math.max(0, Math.floor(fam.hijos ?? 0));
  let desc = 0;
  for (let i = 0; i < hijos; i++) desc += m.descendientes[Math.min(i, m.descendientes.length - 1)];
  desc += Math.min(hijos, Math.max(0, fam.hijosMenores3 ?? 0)) * m.descendiente_menor_3;
  if (!(fam.hijosEnteros ?? false)) desc = desc / 2;
  const disc = fam.discapacidad === 65 ? m.discapacidad_65 + m.gastos_asistencia : fam.discapacidad === 33 ? m.discapacidad_33 : 0;
  const asc = Math.max(0, fam.ascendientes ?? 0) * m.ascendiente_mayor_65;
  return { total: personal + desc + disc + asc, personal, descendientes: desc, discapacidad: disc, ascendientes: asc };
}

export function limiteExento(F: any, fam: Familia = {}): number | null {
  const t = F.irpf.retenciones.limite_exento;
  if (!t) return null;
  const hijos = fam.hijos ?? 0;
  const fila = hijos >= 2 ? t.dos_hijos : hijos === 1 ? t.un_hijo : t.sin_hijos;
  if (!fila) return null;
  const sit = fam.situacion ?? 3;
  const clave = sit === 1 ? 'soltero' : sit === 2 ? 'con_conyuge_sin_rentas' : 'otras';
  return fila[clave] ?? fila.otras ?? null;
}

export interface EntradaRetencion extends Familia {
  brutoAnual: number;
  ssAnual: number;
  contratoInferiorAno?: boolean;
}

export interface ResultadoRetencion {
  rnPrevio: number;
  reduccion: number;
  gastos: number;
  base: number;
  minimo: number;
  cuota: number;
  tipo: number;
  importe: number;
  exento: boolean;
  limite43: boolean;
}

export function retencion(e: EntradaRetencion, F: any): ResultadoRetencion {
  const R = e.brutoAnual;
  const rnPrevio = pos(R - e.ssAnual);
  const reduccion = reduccionTrabajo(rnPrevio, F);
  const gastos = otrosGastos(F, e);
  const base = pos(rnPrevio - gastos - reduccion);
  const mpf = minimoPersonalFamiliar(F, e).total;
  const escala: Tramo[] = F.irpf.retenciones.escala;
  const lim = limiteExento(F, e);
  const exento = lim !== null && R <= lim;
  let cuota = exento ? 0 : pos(cuotaEscala(base, escala) - cuotaEscala(mpf, escala));
  let limite43 = false;
  if (!exento && lim !== null && R <= 35200) {
    const tope = 0.43 * pos(R - lim);
    if (cuota > tope) { cuota = tope; limite43 = true; }
  }
  let tipo = R > 0 ? Math.round((cuota / R) * 10000) / 100 : 0;
  const minimo = e.contratoInferiorAno ? F.irpf.retenciones.minimo_contratos_inferiores_ano_pct ?? 2 : 0;
  if (!exento && tipo < minimo) tipo = minimo;
  return { rnPrevio: r2(rnPrevio), reduccion: r2(reduccion), gastos: r2(gastos), base: r2(base), minimo: r2(mpf), cuota: r2(cuota), tipo, importe: r2(R * tipo / 100), exento, limite43 };
}

/** Escala autonómica de una comunidad (Ceuta y Melilla usan la estatal con bonificación). */
export function escalaAutonomica(F: any, ccaa: string): { escala: Tramo[]; minimoPersonal?: number; bonificacion: number; nombre?: string } {
  const a = F.irpf.escalas_autonomicas[ccaa];
  if (!a) throw new Error(`Comunidad sin escala: ${ccaa}`);
  return { escala: a.escala, minimoPersonal: a.minimo_personal ?? undefined, bonificacion: a.bonificacion_cuota_pct ?? 0, nombre: a.nombre };
}

export function deduccionSMI(F: any, rendimientosIntegros: number): number {
  const d = F.irpf.rendimientos_trabajo.deduccion_smi;
  if (!d || !d.importe_max) return 0;
  if (rendimientosIntegros <= d.umbral_sin_reduccion) return d.importe_max;
  if (rendimientosIntegros >= d.umbral_fin) return 0;
  const coef = d.importe_max / (d.umbral_fin - d.umbral_sin_reduccion);
  return pos(d.importe_max - coef * (rendimientosIntegros - d.umbral_sin_reduccion));
}

export interface EntradaCuota extends Familia {
  baseGeneral: number;
  baseAhorro?: number;
  ccaa: string;
  rendimientosTrabajoIntegros?: number;
}

export interface ResultadoCuota {
  estatal: number;
  autonomica: number;
  ahorro: number;
  deduccionSMI: number;
  total: number;
  tipoMedio: number;
  tipoMarginal: number;
  minimoEstatal: number;
  minimoAutonomico: number;
}

/** Cuota del ahorro: la escala estatal y la autonómica del ahorro (o la total si solo hay una). */
export function cuotaAhorro(base: number, F: any): number {
  const e = F.irpf.escala_ahorro_estatal;
  const a = F.irpf.escala_ahorro_autonomica;
  if (e && a) return cuotaEscala(base, e) + cuotaEscala(base, a);
  return cuotaEscala(base, F.irpf.escala_ahorro_total ?? e ?? []);
}

export function escalaAhorroTotal(F: any): Tramo[] {
  const e = F.irpf.escala_ahorro_estatal;
  const a = F.irpf.escala_ahorro_autonomica;
  return e && a ? sumarEscalas(e, a) : F.irpf.escala_ahorro_total ?? e;
}

export function cuotaAnual(e: EntradaCuota, F: any): ResultadoCuota {
  const ccaa = escalaAutonomica(F, e.ccaa);
  const est: Tramo[] = F.irpf.escala_estatal;
  const bg = pos(e.baseGeneral);
  const ba = pos(e.baseAhorro ?? 0);
  const mE = minimoPersonalFamiliar(F, e).total;
  const mA = minimoPersonalFamiliar(F, e, ccaa.minimoPersonal).total;
  // El mínimo se aplica primero a la base general y el sobrante a la del ahorro (art. 56 LIRPF)
  const mEg = Math.min(mE, bg), mAg = Math.min(mA, bg);
  const estatal = pos(cuotaEscala(bg, est) - cuotaEscala(mEg, est));
  let autonomica = pos(cuotaEscala(bg, ccaa.escala) - cuotaEscala(mAg, ccaa.escala));
  let ahorro = 0;
  if (ba > 0) {
    const restoE = mE - mEg, restoA = mA - mAg;
    const eE = F.irpf.escala_ahorro_estatal, eA = F.irpf.escala_ahorro_autonomica;
    if (eE && eA) ahorro = pos(cuotaEscala(ba, eE) - cuotaEscala(Math.min(restoE, ba), eE)) + pos(cuotaEscala(ba, eA) - cuotaEscala(Math.min(restoA, ba), eA));
    else ahorro = pos(cuotaAhorro(ba, F) - cuotaAhorro(Math.min(restoE, ba), F));
  }
  let total = estatal + autonomica + ahorro;
  if (ccaa.bonificacion) total = total * (1 - ccaa.bonificacion / 100);
  const dSMI = Math.min(total, deduccionSMI(F, e.rendimientosTrabajoIntegros ?? Infinity));
  total = pos(total - dSMI);
  const marg = tipoMarginal(bg, est) + tipoMarginal(bg, ccaa.escala);
  return {
    estatal: r2(estatal),
    autonomica: r2(autonomica),
    ahorro: r2(ahorro),
    deduccionSMI: r2(dSMI),
    total: r2(total),
    tipoMedio: bg + ba > 0 ? r2((total / (bg + ba)) * 100) : 0,
    tipoMarginal: r2(ccaa.bonificacion ? marg * (1 - ccaa.bonificacion / 100) : marg),
    minimoEstatal: r2(mE),
    minimoAutonomico: r2(mA),
  };
}

/** Base liquidable general de un asalariado a partir del bruto y la Seguridad Social. */
export function baseTrabajo(brutoAnual: number, ssAnual: number, F: any, fam: Familia = {}): { rnPrevio: number; reduccion: number; gastos: number; base: number } {
  const rnPrevio = pos(brutoAnual - ssAnual);
  const reduccion = reduccionTrabajo(rnPrevio, F);
  const gastos = otrosGastos(F, fam);
  return { rnPrevio, reduccion, gastos, base: pos(rnPrevio - gastos - reduccion) };
}
