// Motor de vivienda e hipoteca (sitio HogarClaro). Funciones puras: ninguna cifra legal dentro.
// Los parámetros llegan en V = params/es/<año>/vivienda.json (tipos de ITP y AJD, aranceles, comisiones,
// coeficientes de plusvalía, Euríbor, IRAV…). Los tipos de interés van siempre en % anual (3.01 = 3,01 %).
import { r2, cuotaEscala, type Tramo } from './base';

// ——— Préstamo francés ———

/** Cuota mensual del sistema francés: C = P·i / (1 − (1+i)^−n), con i = TIN/12. */
export function cuota(capital: number, tinPct: number, meses: number): number {
  if (capital <= 0 || meses <= 0) return 0;
  const i = tinPct / 100 / 12;
  if (Math.abs(i) < 1e-12) return capital / meses;
  return (capital * i) / (1 - Math.pow(1 + i, -meses));
}

/** Capital que se puede devolver con una cuota dada: P = C·(1 − (1+i)^−n) / i. */
export function capitalParaCuota(c: number, tinPct: number, meses: number): number {
  if (c <= 0 || meses <= 0) return 0;
  const i = tinPct / 100 / 12;
  if (Math.abs(i) < 1e-12) return c * meses;
  return (c * (1 - Math.pow(1 + i, -meses))) / i;
}

/** Meses necesarios para devolver un capital con una cuota fija: n = −ln(1 − P·i/C) / ln(1+i). Infinity si no alcanza. */
export function mesesParaCuota(capital: number, tinPct: number, c: number): number {
  if (capital <= 0) return 0;
  const i = tinPct / 100 / 12;
  if (Math.abs(i) < 1e-12) return Math.ceil(capital / c);
  const x = 1 - (capital * i) / c;
  if (x <= 0) return Infinity;
  return -Math.log(x) / Math.log(1 + i);
}

export interface FilaMes { mes: number; tin: number; cuota: number; interes: number; capital: number; pendiente: number }
export interface FilaAnio { anio: number; cuotaMedia: number; pagado: number; interes: number; capital: number; pendiente: number; tin: number }
export interface Cuadro { meses: FilaMes[]; anios: FilaAnio[]; intereses: number; pagado: number; cuotaInicial: number }

/**
 * Cuadro de amortización mes a mes. `tinPorAnio(k)` da el TIN del año k (1, 2, …): fijo, variable con revisión
 * anual o mixto. Al cambiar el tipo la cuota se recalcula con el capital pendiente y los meses que quedan,
 * como hace el banco en cada revisión.
 */
export function cuadro(capital: number, meses: number, tinPorAnio: (anio: number) => number): Cuadro {
  const filas: FilaMes[] = [];
  let pendiente = capital, c = 0, tinAnt = NaN;
  for (let m = 1; m <= meses && pendiente > 0.005; m++) {
    const tin = tinPorAnio(Math.ceil(m / 12));
    if (tin !== tinAnt || m === 1) { c = cuota(pendiente, tin, meses - m + 1); tinAnt = tin; }
    const interes = (pendiente * tin) / 100 / 12;
    let amort = c - interes;
    if (m === meses || amort > pendiente) amort = pendiente;
    pendiente -= amort;
    filas.push({ mes: m, tin, cuota: interes + amort, interes, capital: amort, pendiente: Math.max(0, pendiente) });
  }
  const anios: FilaAnio[] = [];
  for (let k = 0; k * 12 < filas.length; k++) {
    const g = filas.slice(k * 12, k * 12 + 12);
    const pagado = g.reduce((a, f) => a + f.cuota, 0);
    anios.push({ anio: k + 1, cuotaMedia: r2(pagado / g.length), pagado: r2(pagado), interes: r2(g.reduce((a, f) => a + f.interes, 0)), capital: r2(g.reduce((a, f) => a + f.capital, 0)), pendiente: r2(g[g.length - 1].pendiente), tin: g[0].tin });
  }
  const intereses = filas.reduce((a, f) => a + f.interes, 0);
  return { meses: filas, anios, intereses: r2(intereses), pagado: r2(intereses + capital), cuotaInicial: r2(filas[0]?.cuota ?? 0) };
}

export interface Hipoteca { cuota: number; intereses: number; total: number; cuadro: Cuadro }
/** Hipoteca a tipo fijo. */
export function hipotecaFija(capital: number, tinPct: number, anios: number): Hipoteca {
  const cu = cuadro(capital, Math.round(anios * 12), () => tinPct);
  return { cuota: r2(cuota(capital, tinPct, Math.round(anios * 12))), intereses: cu.intereses, total: cu.pagado, cuadro: cu };
}

/**
 * Hipoteca mixta o variable. Los `aniosFijos` primeros años al `tinFijo`; después, Euríbor + diferencial con revisión anual.
 * `euriborAnio(k)` da el Euríbor del año k (escenario); con aniosFijos = 0 es una variable pura (el primer año también va
 * a Euríbor + diferencial, salvo que se pase tinFijo y aniosFijos = 1 como «tipo del primer año»).
 */
export function hipotecaVariable(capital: number, anios: number, o: { tinFijo?: number; aniosFijos?: number; diferencial: number; euriborAnio: (k: number) => number }): Hipoteca {
  const af = o.aniosFijos ?? 0;
  const tin = (k: number) => (k <= af && o.tinFijo != null ? o.tinFijo : Math.max(0, o.euriborAnio(k) + o.diferencial));
  const cu = cuadro(capital, Math.round(anios * 12), tin);
  return { cuota: cu.cuotaInicial, intereses: cu.intereses, total: cu.pagado, cuadro: cu };
}

// ——— TAE ———

/**
 * TAE por iteración de Newton: tipo mensual r que iguala el dinero recibido (capital − gastos a cargo del cliente)
 * con el valor actual de los pagos mensuales (cuota + vinculaciones). TAE = (1 + r)^12 − 1.
 * Metodología del anexo de la Orden EHA/2899/2011 simplificada a pagos mensuales iguales por periodo.
 */
export function tae(recibido: number, pagos: number[]): number {
  if (recibido <= 0 || !pagos.length) return 0;
  let r = 0.003;
  for (let k = 0; k < 100; k++) {
    let f = -recibido, df = 0;
    for (let t = 0; t < pagos.length; t++) {
      const d = Math.pow(1 + r, -(t + 1));
      f += pagos[t] * d;
      df += -(t + 1) * pagos[t] * d / (1 + r);
    }
    const nr = r - f / df;
    if (!Number.isFinite(nr)) break;
    if (Math.abs(nr - r) < 1e-12) { r = nr; break; }
    r = Math.max(-0.99, nr);
  }
  return r2((Math.pow(1 + r, 12) - 1) * 100 * 100) / 100;
}

// ——— Impuestos y gastos de la compraventa ———

export interface DatoComunidad { tipo: number | null; escala: Tramo[] | null; progresiva: boolean; pendiente: boolean; foral: boolean; tramoAlto?: { desde: number; tipo: number } }

export function datosITP(V: any, ccaa: string): DatoComunidad {
  const c = V.itp_vivienda_usada.comunidades[ccaa];
  if (!c) throw new Error(`Sin ITP para ${ccaa}`);
  return { tipo: c.tipo_general ?? null, escala: Array.isArray(c.escala) ? c.escala : null, progresiva: !!c.escala_progresiva_por_tramos, pendiente: !!c.pendiente_cotejo, foral: !!c.foral, tramoAlto: c.tramo_alto };
}
export function datosAJD(V: any, ccaa: string): DatoComunidad {
  const c = V.ajd_documentos_notariales.comunidades[ccaa] ?? { tipo_general: null, pendiente_cotejo: true };
  return { tipo: c.tipo_general ?? null, escala: null, progresiva: false, pendiente: !!c.pendiente_cotejo, foral: !!c.foral, tramoAlto: c.tramo_alto };
}

/** Cuota de un impuesto autonómico: escala progresiva por tramos, tipo único o tipo de valor alto (sobre todo el valor). */
export function cuotaComunidad(base: number, d: DatoComunidad, tipoForzado?: number | null): { cuota: number; tipoEfectivo: number; tipoMarginal: number } {
  if (base <= 0) return { cuota: 0, tipoEfectivo: 0, tipoMarginal: 0 };
  if (tipoForzado != null) return { cuota: r2(base * tipoForzado / 100), tipoEfectivo: tipoForzado, tipoMarginal: tipoForzado };
  if (d.escala) {
    const cu = cuotaEscala(base, d.escala);
    const marg = d.escala.find((t) => t.hasta == null || base <= t.hasta)!.tipo;
    return { cuota: r2(cu), tipoEfectivo: r2((cu / base) * 100 * 100) / 100, tipoMarginal: marg };
  }
  if (d.tipo == null) return { cuota: NaN, tipoEfectivo: NaN, tipoMarginal: NaN };
  const tipo = d.tramoAlto && base >= d.tramoAlto.desde ? d.tramoAlto.tipo : d.tipo;
  return { cuota: r2(base * tipo / 100), tipoEfectivo: tipo, tipoMarginal: tipo };
}

/** Arancel acumulativo (notaría o registro): fijo hasta el primer tramo y ‰ sobre el exceso de cada tramo. */
export function arancel(base: number, escala: { hasta: number | null; fijo?: number; por_mil?: number | null }[]): number {
  let total = 0, desde = 0;
  for (const t of escala) {
    const techo = t.hasta ?? Infinity;
    if (t.fijo != null) total += t.fijo;
    else if (t.por_mil != null && base > desde) total += ((Math.min(base, techo) - desde) * t.por_mil) / 1000;
    if (base <= techo) break;
    desde = techo;
  }
  return total;
}
/** Notaría de la escritura de compraventa (RD 1426/1989, n.º 2) con la rebaja general, sin IVA ni copias. */
export function notaria(base: number, V: any) {
  const escala = arancel(base, V.arancel_notarial.escala);
  return { escala: r2(escala), conRebaja: r2(escala * (1 - V.arancel_notarial.rebaja_general_pct / 100)) };
}
/** Registro de la propiedad (RD 1427/1989, n.º 2), sin IVA. `reduccionPct` para la subrogación (90 %). */
export function registro(base: number, V: any, reduccionPct = 0) {
  return r2(arancel(base, V.arancel_registral.escala) * (1 - reduccionPct / 100));
}

export interface EntradaGastos {
  precio: number; ccaa: string; nueva: boolean;
  valorReferencia?: number; // valor de referencia de Catastro (si es mayor que el precio, es la base del ITP)
  tipoITP?: number | null; // tipo reducido o manual
  tipoAJD?: number | null; // si la comunidad no tiene dato o hay tipo reducido
  vpo?: boolean; // IVA superreducido
  tipoIndirecto?: number | null; // IGIC (Canarias) o IPSI (Ceuta y Melilla) en obra nueva
  gestoria?: number; tasacion?: number; otrosNotaria?: number;
}
export interface Gastos {
  base: number; impuestos: number; itp: number; iva: number; ajd: number; tipoITP: number; tipoIVA: number; tipoAJD: number;
  notaria: number; registro: number; ivaHonorarios: number; gestoria: number; tasacion: number;
  honorarios: number; total: number; totalConPrecio: number; pctSobrePrecio: number; pendiente: boolean; faltaDato: boolean;
}
/** Todo lo que se paga al comprar, además del precio. Los gastos de la escritura de hipoteca los paga el banco (Ley 5/2019). */
export function gastosCompra(e: EntradaGastos, V: any): Gastos {
  const ivaSrv = V.iva_vivienda.general_servicios.tipo;
  let itp = 0, iva = 0, ajd = 0, tipoITP = 0, tipoIVA = 0, tipoAJD = 0, pendiente = false, faltaDato = false;
  const base = Math.max(e.precio, e.valorReferencia ?? 0);
  if (!e.nueva) {
    const d = datosITP(V, e.ccaa);
    const r = cuotaComunidad(base, d, e.tipoITP);
    itp = r.cuota; tipoITP = r.tipoEfectivo; pendiente = d.pendiente && e.tipoITP == null;
  } else {
    const especial = e.ccaa === 'CN' || e.ccaa === 'CE' || e.ccaa === 'ML';
    tipoIVA = especial ? (e.tipoIndirecto ?? NaN) : e.vpo ? V.iva_vivienda.superreducido.tipo : V.iva_vivienda.general_vivienda_nueva.tipo;
    if (!Number.isFinite(tipoIVA)) { faltaDato = true; tipoIVA = 0; }
    iva = r2(e.precio * tipoIVA / 100);
    const d = datosAJD(V, e.ccaa);
    const r = cuotaComunidad(e.precio, d, e.tipoAJD);
    if (!Number.isFinite(r.cuota)) { faltaDato = true; } else { ajd = r.cuota; tipoAJD = r.tipoEfectivo; }
    pendiente = (d.pendiente && e.tipoAJD == null) || especial || !!e.vpo;
  }
  const no = notaria(e.precio, V).conRebaja + (e.otrosNotaria ?? 0);
  const re = registro(e.precio, V);
  const gestoria = e.gestoria ?? 0, tasacion = e.tasacion ?? 0;
  const ivaHonorarios = r2((no + re + gestoria + tasacion) * ivaSrv / 100);
  const impuestos = r2(itp + iva + ajd);
  const honorarios = r2(no + re + gestoria + tasacion + ivaHonorarios);
  const total = r2(impuestos + honorarios);
  return { base, impuestos, itp, iva, ajd, tipoITP, tipoIVA, tipoAJD, notaria: r2(no), registro: re, ivaHonorarios, gestoria, tasacion, honorarios, total, totalConPrecio: r2(e.precio + total), pctSobrePrecio: e.precio ? r2((total / e.precio) * 100) : 0, pendiente, faltaDato };
}

// ——— Capacidad de endeudamiento ———

export interface Capacidad { cuotaMax: number; prestamoMax: number; precioMax: number; limitadoPor: 'cuota' | 'ahorro'; entrada: number; gastos: number; prestamo: number }
/**
 * Préstamo y precio máximos. Cuota máxima = ingresos netos × esfuerzo − otras deudas. El precio máximo cumple a la vez
 * que el préstamo no pase de `financiacion` % del precio ni del máximo por cuota, y que el ahorro cubra la entrada y los
 * gastos de compra de esa comunidad (vivienda usada). Se busca por bisección.
 */
export function capacidad(e: { ingresos: number; deudas: number; esfuerzoPct: number; tin: number; anios: number; ahorro: number; financiacionPct: number; ccaa: string; gestoria?: number; tasacion?: number }, V: any): Capacidad {
  const cuotaMax = Math.max(0, e.ingresos * e.esfuerzoPct / 100 - e.deudas);
  const prestamoMax = capitalParaCuota(cuotaMax, e.tin, Math.round(e.anios * 12));
  const ok = (precio: number) => {
    const g = gastosCompra({ precio, ccaa: e.ccaa, nueva: false, gestoria: e.gestoria, tasacion: e.tasacion }, V).total;
    const prestamo = Math.min(prestamoMax, precio * e.financiacionPct / 100);
    return precio + g - prestamo <= e.ahorro;
  };
  let lo = 0, hi = Math.max(1000, (prestamoMax + e.ahorro) * 2);
  for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
  const precio = Math.floor(lo);
  const g = gastosCompra({ precio, ccaa: e.ccaa, nueva: false, gestoria: e.gestoria, tasacion: e.tasacion }, V).total;
  const prestamo = Math.min(prestamoMax, precio * e.financiacionPct / 100);
  const limitadoPor = prestamo >= prestamoMax - 1 ? 'cuota' : 'ahorro';
  return { cuotaMax: r2(cuotaMax), prestamoMax: r2(prestamoMax), precioMax: precio, limitadoPor, entrada: r2(precio - prestamo), gastos: g, prestamo: r2(prestamo) };
}

/** Ingreso neto mensual mínimo para una cuota con un esfuerzo dado. */
export const ingresoNecesario = (cuotaMes: number, esfuerzoPct: number) => r2(cuotaMes / (esfuerzoPct / 100));

// ——— Amortización anticipada, comisiones y subrogación ———

/** Tope de la comisión por amortización anticipada (Ley 5/2019, art. 23), en % del importe amortizado. */
export function topeComision(V: any, tipo: 'fijo' | 'variable', aniosDesdeFirma: number, opcionVariable: 'a' | 'b' = 'a'): number {
  const c = V.comision_amortizacion_anticipada;
  if (tipo === 'fijo') return aniosDesdeFirma < 10 ? c.fijo.primeros_10_anios_pct : c.fijo.resto_pct;
  const o = opcionVariable === 'b' ? c.variable.opcion_b : c.variable.opcion_a;
  return aniosDesdeFirma < o.durante_anios ? o.tope_pct : c.variable.despues;
}

export interface Anticipada { cuotaAntes: number; interesesAntes: number; cuotaCuota: number; interesesCuota: number; ahorroCuota: number; mesesPlazo: number; interesesPlazo: number; ahorroPlazo: number; mesesMenos: number; comision: number; topePct: number }
/** Compara reducir cuota y reducir plazo tras amortizar `importe`. La comisión es el tope legal (o la pérdida financiera, si es menor y se indica). */
export function amortizacionAnticipada(e: { pendiente: number; tin: number; mesesRestantes: number; importe: number; tipo: 'fijo' | 'variable'; aniosDesdeFirma: number; opcionVariable?: 'a' | 'b'; perdidaFinanciera?: number | null }, V: any): Anticipada {
  const n = e.mesesRestantes;
  const cuotaAntes = cuota(e.pendiente, e.tin, n);
  const interesesAntes = cuotaAntes * n - e.pendiente;
  const nuevo = Math.max(0, e.pendiente - e.importe);
  const cuotaCuota = cuota(nuevo, e.tin, n);
  const interesesCuota = cuotaCuota * n - nuevo;
  const mesesExactos = nuevo > 0 ? mesesParaCuota(nuevo, e.tin, cuotaAntes) : 0;
  const mesesPlazo = Math.ceil(mesesExactos - 1e-9);
  const interesesPlazo = nuevo > 0 ? cuadro(nuevo, mesesPlazo, () => e.tin).intereses : 0;
  const topePct = topeComision(V, e.tipo, e.aniosDesdeFirma, e.opcionVariable);
  let comision = (Math.min(e.importe, e.pendiente) * topePct) / 100;
  if (e.perdidaFinanciera != null) comision = Math.min(comision, Math.max(0, e.perdidaFinanciera));
  return {
    cuotaAntes: r2(cuotaAntes), interesesAntes: r2(interesesAntes), cuotaCuota: r2(cuotaCuota), interesesCuota: r2(interesesCuota), ahorroCuota: r2(interesesAntes - interesesCuota),
    mesesPlazo, interesesPlazo: r2(interesesPlazo), ahorroPlazo: r2(interesesAntes - interesesPlazo), mesesMenos: n - mesesPlazo, comision: r2(comision), topePct,
  };
}

export interface Subrogacion { cuotaActual: number; cuotaNueva: number; ahorroMes: number; ahorroBruto: number; ahorroValorActual: number; costes: number; comision: number; registroSub: number; neto: number; mesesRecuperar: number }
/** ¿Compensa cambiar de banco? Diferencia de cuotas (y su valor actual a `descuentoPct`) frente a comisión, registro y otros costes. */
export function subrogacion(e: { pendiente: number; tinActual: number; tinNuevo: number; mesesRestantes: number; tipo: 'fijo' | 'variable'; aniosDesdeFirma: number; tasacion: number; otros: number; descuentoPct?: number }, V: any): Subrogacion {
  const n = e.mesesRestantes;
  const a = cuota(e.pendiente, e.tinActual, n), b = cuota(e.pendiente, e.tinNuevo, n);
  const comision = (e.pendiente * topeComision(V, e.tipo, e.aniosDesdeFirma)) / 100;
  const registroSub = registro(e.pendiente, V, V.arancel_registral.reduccion_subrogacion_pct);
  const costes = comision + registroSub + e.tasacion + e.otros;
  const i = (e.descuentoPct ?? 0) / 100 / 12;
  const va = i > 0 ? ((a - b) * (1 - Math.pow(1 + i, -n))) / i : (a - b) * n;
  const ahorroMes = a - b;
  return { cuotaActual: r2(a), cuotaNueva: r2(b), ahorroMes: r2(ahorroMes), ahorroBruto: r2(ahorroMes * n), ahorroValorActual: r2(va), costes: r2(costes), comision: r2(comision), registroSub, neto: r2(va - costes), mesesRecuperar: ahorroMes > 0 ? Math.ceil(costes / ahorroMes) : Infinity };
}

// ——— Fija o variable ———

export interface Escenario { nombre: string; delta: number; cuotaInicial: number; cuotaTrasRevision: number; intereses: number; total: number }
/**
 * Coste total de una fija frente a una variable con tres escenarios de Euríbor: se mantiene, sube `paso` puntos o baja
 * `paso` puntos desde la primera revisión (año 2). La variable tiene `tinInicial` el primer año. Además, el Euríbor
 * constante a partir del año 2 con el que las dos cuestan lo mismo (bisección).
 */
export function fijaOVariable(e: { capital: number; anios: number; tinFijo: number; tinInicial: number; diferencial: number; euribor: number; paso: number }) {
  const fija = hipotecaFija(e.capital, e.tinFijo, e.anios);
  const variable = (eur: number) => hipotecaVariable(e.capital, e.anios, { tinFijo: e.tinInicial, aniosFijos: 1, diferencial: e.diferencial, euriborAnio: () => eur });
  const esc: Escenario[] = [
    { nombre: 'baja', delta: -e.paso }, { nombre: 'igual', delta: 0 }, { nombre: 'sube', delta: e.paso },
  ].map((s) => { const h = variable(Math.max(-1, e.euribor + s.delta)); return { ...s, cuotaInicial: h.cuota, cuotaTrasRevision: r2(h.cuadro.meses[12]?.cuota ?? h.cuota), intereses: h.intereses, total: h.total }; });
  let lo = -1, hi = 15;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (variable(m).intereses < fija.intereses) lo = m; else hi = m; }
  return { fija, escenarios: esc, euriborEquilibrio: r2(((lo + hi) / 2) * 1000) / 1000 };
}

// ——— Plusvalía municipal ———

export function coeficientePlusvalia(coefs: Record<string, number> | null | undefined, anios: number): number | null {
  if (!coefs) return null;
  const k = anios >= 20 ? '20_o_mas' : String(Math.max(0, Math.floor(anios)));
  return coefs[k] ?? null;
}
/** IIVTNU: método objetivo y real; se paga el menor y nada si no hay ganancia (RDL 26/2021). */
export function plusvalia(e: { vcSuelo: number; vcTotal: number; compra: number; venta: number; anios: number; tipoPct: number; coeficiente: number | null }) {
  const objetivaBase = e.coeficiente == null ? NaN : e.vcSuelo * e.coeficiente;
  const ganancia = e.venta - e.compra;
  const proporcion = e.vcTotal > 0 ? Math.min(1, e.vcSuelo / e.vcTotal) : 0;
  const realBase = Math.max(0, ganancia * proporcion);
  const objetiva = Number.isFinite(objetivaBase) ? r2(objetivaBase * e.tipoPct / 100) : NaN;
  const real = r2(realBase * e.tipoPct / 100);
  const exenta = ganancia <= 0;
  const aPagar = exenta ? 0 : Number.isFinite(objetiva) ? Math.min(objetiva, real) : real;
  return { objetiva, real, aPagar: r2(aPagar), exenta, metodo: exenta ? 'exenta' : !Number.isFinite(objetiva) || real < objetiva ? 'real' : 'objetiva', baseObjetiva: r2(objetivaBase), baseReal: r2(realBase), ganancia: r2(ganancia), proporcion: r2(proporcion * 100) };
}

// ——— Alquiler ———

/** Nueva renta tras la actualización anual con el índice (IRAV, IPC…) en %. */
export const actualizarRenta = (renta: number, indicePct: number) => r2(renta * (1 + indicePct / 100));

/** Rentabilidad bruta y neta (antes de IRPF) de una vivienda en alquiler. */
export function rentabilidad(e: { precio: number; gastosCompra: number; rentaMes: number; ibi: number; comunidad: number; seguro: number; mantenimientoPct: number; vacioMeses: number; intereses: number; prestamo: number; pctConstruccion: number; amortizacionPct: number }) {
  const inversionTotal = e.precio + e.gastosCompra;
  const ingresos = e.rentaMes * (12 - e.vacioMeses);
  const mantenimiento = (ingresos * e.mantenimientoPct) / 100;
  const gastos = e.ibi + e.comunidad + e.seguro + mantenimiento;
  const amortizacion = ((e.precio + e.gastosCompra) * e.pctConstruccion / 100) * e.amortizacionPct / 100;
  const neto = ingresos - gastos - e.intereses;
  const propio = inversionTotal - e.prestamo;
  return {
    inversionTotal: r2(inversionTotal), ingresos: r2(ingresos), gastos: r2(gastos), mantenimiento: r2(mantenimiento), amortizacion: r2(amortizacion),
    bruta: r2((e.rentaMes * 12 / inversionTotal) * 100), neta: r2(((ingresos - gastos) / inversionTotal) * 100),
    flujo: r2(neto), sobrePropio: propio > 0 ? r2((neto / propio) * 100) : 0, rendimientoFiscal: r2(neto - amortizacion),
  };
}

/**
 * ¿Alquilar o comprar? Patrimonio al cabo de N años en los dos caminos con las hipótesis del usuario.
 * Comprar: entrada + gastos el primer día, cuota, IBI, comunidad y mantenimiento; al final, valor de la casa − deuda.
 * Alquilar: el dinero de la entrada y los gastos se invierte; cada mes se invierte también la diferencia entre lo que
 * costaría comprar y el alquiler (o se desinvierte si el alquiler es más caro). El alquiler sube cada año con el índice.
 */
export function alquilarOComprar(e: { precio: number; gastos: number; financiacionPct: number; tin: number; aniosHipoteca: number; costesAnuales: number; alquilerMes: number; subidaAlquilerPct: number; revalorizacionPct: number; rentabilidadPct: number; horizonte: number }) {
  const prestamo = e.precio * e.financiacionPct / 100;
  const inicial = e.precio - prestamo + e.gastos;
  const meses = Math.round(e.aniosHipoteca * 12);
  const cu = cuadro(prestamo, meses, () => e.tin);
  const rm = Math.pow(1 + e.rentabilidadPct / 100, 1 / 12) - 1;
  let cartera = inicial, alquiler = e.alquilerMes, pagadoComprar = inicial, pagadoAlquilar = 0;
  const filas: { anio: number; comprar: number; alquilar: number }[] = [];
  for (let m = 1; m <= e.horizonte * 12; m++) {
    if (m > 1 && (m - 1) % 12 === 0) alquiler *= 1 + e.subidaAlquilerPct / 100;
    const cuotaMes = cu.meses[m - 1]?.cuota ?? 0;
    const costeComprar = cuotaMes + e.costesAnuales / 12;
    pagadoComprar += costeComprar; pagadoAlquilar += alquiler;
    cartera = cartera * (1 + rm) + (costeComprar - alquiler);
    if (m % 12 === 0) {
      const valor = e.precio * Math.pow(1 + e.revalorizacionPct / 100, m / 12);
      const deuda = cu.meses[m - 1]?.pendiente ?? 0;
      filas.push({ anio: m / 12, comprar: r2(valor - deuda), alquilar: r2(cartera) });
    }
  }
  const fin = filas[filas.length - 1];
  return { prestamo: r2(prestamo), inicial: r2(inicial), cuota: cu.cuotaInicial, filas, comprar: fin.comprar, alquilar: fin.alquilar, diferencia: r2(fin.comprar - fin.alquilar), pagadoComprar: r2(pagadoComprar), pagadoAlquilar: r2(pagadoAlquilar), alquilerFinal: r2(alquiler) };
}

// ——— Lectura de series de los parámetros ———

/** Último dato publicado de una serie mensual ({mes, valor}) de los parámetros. */
export function ultimo(serie: { mes: string; valor: number | null; pendiente_cotejo?: boolean }[]) {
  const s = serie.filter((x) => x.valor != null);
  return s[s.length - 1] as { mes: string; valor: number; pendiente_cotejo?: boolean };
}
/** Dato de un mes concreto (AAAA-MM) o null. */
export const delMes = (serie: { mes: string; valor: number | null }[], mes: string) => serie.find((x) => x.mes === mes && x.valor != null)?.valor ?? null;

const MESES = { es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'], ca: ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'] };
/** «septiembre de 2026» / «setembre del 2026». */
export function nombreMes(mes: string, lang: 'es' | 'ca'): string {
  const [a, m] = mes.split('-').map(Number);
  const n = MESES[lang][m - 1];
  return lang === 'es' ? `${n} de ${a}` : `${n} del ${a}`;
}
