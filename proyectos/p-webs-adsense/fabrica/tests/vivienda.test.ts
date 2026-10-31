// Motor de vivienda (HogarClaro): casos de comprobación de sitios-nuevos/SITIO-4-HIPOTECAS.md y comprobaciones propias.
import { describe, it, expect } from 'vitest';
import { params, anios } from '../src/lib/params';
import {
  cuota, capitalParaCuota, mesesParaCuota, cuadro, hipotecaFija, hipotecaVariable, tae, notaria, registro, gastosCompra,
  capacidad, amortizacionAnticipada, subrogacion, fijaOVariable, plusvalia, coeficientePlusvalia, actualizarRenta,
  rentabilidad, alquilarOComprar, cuotaComunidad, datosITP, topeComision, ultimo,
} from '../src/lib/calc/vivienda';

const P = params('es', 2026);
const V = P.vivienda;

describe('parámetros de vivienda', () => {
  it('los bloques extra se cargan sin romper laboral y fiscal', () => {
    expect(P.laboral.smi).toBeTruthy();
    expect(P.fiscal.irpf).toBeTruthy();
    expect(V.pais).toBe('es');
    expect(anios('es')).toEqual([2026, 2027]);
    expect(params('es', 2027).vivienda.estado).toBe('provisional');
    expect(params('es', 2027).provisional).toBe(true);
    expect(params('es', 2026).provisional).toBe(false);
    expect(params('us', 2026).vivienda).toBeUndefined();
  });
  it('todas las comunidades tienen tipo de ITP y fuente', () => {
    for (const [k, c] of Object.entries<any>(V.itp_vivienda_usada.comunidades)) {
      expect(c.tipo_general, k).toBeGreaterThan(0);
      expect(c.fuente?.url, k).toMatch(/^https:/);
    }
  });
  it('el último Euríbor es el de septiembre de 2026 y está pendiente de cotejo', () => {
    const u = ultimo(V.euribor_12m.serie);
    expect(u.mes).toBe('2026-09');
    expect(u.valor).toBe(3.247);
    expect(u.pendiente_cotejo).toBe(true);
  });
});

describe('cuota francesa', () => {
  it('150.000 € a 30 años al 3,01 %: 633,22 €/mes y 77.957,52 € de intereses', () => {
    const h = hipotecaFija(150000, 3.01, 30);
    expect(h.cuota).toBeCloseTo(633.22, 2);
    expect(h.intereses).toBeCloseTo(77957.52, 0);
  });
  it('200.000 € a 30 años al 3,01 %: 844,29 €', () => expect(cuota(200000, 3.01, 360)).toBeCloseTo(844.29, 2));
  it('hipoteca media del INE (180.785 € a 26 años al 3,01 %): 836,14 €', () => expect(cuota(180785, 3.01, 312)).toBeCloseTo(836.14, 2));
  it('tipo 0: capital entre meses', () => expect(cuota(120000, 0, 240)).toBe(500));
  it('capitalParaCuota y mesesParaCuota son inversas de cuota', () => {
    const c = cuota(150000, 3, 300);
    expect(capitalParaCuota(c, 3, 300)).toBeCloseTo(150000, 4);
    expect(mesesParaCuota(150000, 3, c)).toBeCloseTo(300, 6);
    expect(mesesParaCuota(150000, 3, 300)).toBe(Infinity);
  });
  it('el cuadro cierra a cero y suma el capital', () => {
    const cu = cuadro(100000, 240, () => 3.5);
    expect(cu.meses).toHaveLength(240);
    expect(cu.meses[239].pendiente).toBeCloseTo(0, 6);
    expect(cu.anios.reduce((a, f) => a + f.capital, 0)).toBeCloseTo(100000, 0);
    expect(cu.anios[0].interes).toBeGreaterThan(cu.anios[19].interes);
  });
});

describe('revisión con el Euríbor', () => {
  it('150.000 € pendientes, 25 años, diferencial 0,60: 779,14 € con 3,247 % y 693,66 € con 2,172 %', () => {
    expect(cuota(150000, 3.247 + 0.6, 300)).toBeCloseTo(779.14, 2);
    expect(cuota(150000, 2.172 + 0.6, 300)).toBeCloseTo(693.66, 2);
  });
  it('la variable recalcula la cuota en cada revisión anual', () => {
    const h = hipotecaVariable(150000, 25, { tinFijo: 2.5, aniosFijos: 1, diferencial: 0.6, euriborAnio: (k) => (k === 2 ? 3 : 2) });
    const m = h.cuadro.meses;
    expect(m[0].cuota).toBeCloseTo(cuota(150000, 2.5, 300), 6);
    expect(m[12].cuota).toBeGreaterThan(m[11].cuota);
    expect(m[24].cuota).toBeLessThan(m[12].cuota);
  });
  it('el tipo nunca es negativo', () => {
    const h = hipotecaVariable(100000, 10, { diferencial: 0.5, euriborAnio: () => -1 });
    expect(h.intereses).toBe(0);
  });
});

describe('TAE', () => {
  it('sin gastos ni vinculaciones coincide con el TIN efectivo', () => {
    const c = cuota(150000, 3, 300);
    expect(tae(150000, Array(300).fill(c))).toBeCloseTo((Math.pow(1 + 0.03 / 12, 12) - 1) * 100, 2);
  });
  it('los gastos y los seguros suben la TAE', () => {
    const c = cuota(150000, 3, 300);
    expect(tae(150000 - 600, Array(300).fill(c + 40))).toBeGreaterThan(3.5);
  });
});

describe('aranceles e impuestos de la compraventa', () => {
  it('notaría de 200.000 €: 358,44 € de escala y 340,51 € con la rebaja', () => {
    const n = notaria(200000, V);
    expect(n.escala).toBeCloseTo(358.44, 2);
    expect(n.conRebaja).toBeCloseTo(340.51, 2);
  });
  it('registro de 200.000 €: 196,16 €', () => expect(registro(200000, V)).toBeCloseTo(196.16, 2));
  it('registro con la reducción del 90 % de la subrogación', () => expect(registro(200000, V, 90)).toBeCloseTo(19.62, 2));
  it('ITP de Madrid (6 %) y de Andalucía (7 %)', () => {
    expect(gastosCompra({ precio: 200000, ccaa: 'MD', nueva: false }, V).itp).toBe(12000);
    expect(gastosCompra({ precio: 200000, ccaa: 'AN', nueva: false }, V).itp).toBe(14000);
  });
  it('ITP de Cataluña por tramos progresivos: 10 % hasta 600.000 € y 11 % del exceso', () => {
    expect(cuotaComunidad(700000, datosITP(V, 'CT')).cuota).toBe(71000);
  });
  it('Comunitat Valenciana: 9 % y 11 % sobre todo el valor desde 1 M€', () => {
    expect(cuotaComunidad(300000, datosITP(V, 'VC')).cuota).toBe(27000);
    expect(cuotaComunidad(1200000, datosITP(V, 'VC')).cuota).toBe(132000);
  });
  it('la base del ITP es el valor de referencia si es mayor', () => {
    expect(gastosCompra({ precio: 180000, valorReferencia: 200000, ccaa: 'MD', nueva: false }, V).itp).toBe(12000);
  });
  it('vivienda nueva en Cataluña: 10 % de IVA y 1,5 % de AJD', () => {
    const g = gastosCompra({ precio: 250000, ccaa: 'CT', nueva: true }, V);
    expect(g.iva).toBe(25000);
    expect(g.ajd).toBe(3750);
    expect(g.itp).toBe(0);
  });
  it('sin dato de AJD pide el tipo', () => {
    expect(gastosCompra({ precio: 250000, ccaa: 'MC', nueva: true }, V).faltaDato).toBe(true);
    expect(gastosCompra({ precio: 250000, ccaa: 'MC', nueva: true, tipoAJD: 1.5 }, V).ajd).toBe(3750);
  });
  it('el total suma impuestos, aranceles, gestoría, tasación e IVA de los honorarios', () => {
    const g = gastosCompra({ precio: 200000, ccaa: 'MD', nueva: false, gestoria: 300, tasacion: 350 }, V);
    expect(g.total).toBeCloseTo(12000 + (340.51 + 196.16 + 650) * 1.21, 1);
  });
});

describe('capacidad de endeudamiento', () => {
  it('2.500 € netos al 35 % a 30 años al 3 %: cuota máxima 875 €', () => {
    const c = capacidad({ ingresos: 2500, deudas: 0, esfuerzoPct: 35, tin: 3, anios: 30, ahorro: 60000, financiacionPct: 80, ccaa: 'MD' }, V);
    expect(c.cuotaMax).toBe(875);
    expect(c.prestamoMax).toBeCloseTo(capitalParaCuota(875, 3, 360), 2);
    expect(c.prestamo).toBeLessThanOrEqual(c.prestamoMax + 0.01);
    expect(c.precioMax + c.gastos - c.prestamo).toBeLessThanOrEqual(60000 + 1);
  });
  it('con poco ahorro manda el ahorro', () => {
    const c = capacidad({ ingresos: 4000, deudas: 0, esfuerzoPct: 35, tin: 3, anios: 30, ahorro: 20000, financiacionPct: 80, ccaa: 'CT' }, V);
    expect(c.limitadoPor).toBe('ahorro');
  });
});

describe('amortización anticipada y subrogación', () => {
  it('topes de la Ley 5/2019', () => {
    expect(topeComision(V, 'variable', 2, 'a')).toBe(0.25);
    expect(topeComision(V, 'variable', 4, 'a')).toBe(0);
    expect(topeComision(V, 'variable', 4, 'b')).toBe(0.15);
    expect(topeComision(V, 'fijo', 9)).toBe(2);
    expect(topeComision(V, 'fijo', 10)).toBe(1.5);
  });
  it('reducir plazo ahorra más intereses que reducir cuota', () => {
    const a = amortizacionAnticipada({ pendiente: 150000, tin: 3, mesesRestantes: 300, importe: 20000, tipo: 'variable', aniosDesdeFirma: 2 }, V);
    expect(a.ahorroPlazo).toBeGreaterThan(a.ahorroCuota);
    expect(a.cuotaCuota).toBeLessThan(a.cuotaAntes);
    expect(a.mesesPlazo).toBeLessThan(300);
    expect(a.comision).toBe(50);
  });
  it('la comisión no pasa de la pérdida financiera', () => {
    const a = amortizacionAnticipada({ pendiente: 150000, tin: 3, mesesRestantes: 300, importe: 20000, tipo: 'fijo', aniosDesdeFirma: 2, perdidaFinanciera: 100 }, V);
    expect(a.comision).toBe(100);
  });
  it('subrogación: bajar un punto compensa', () => {
    const s = subrogacion({ pendiente: 150000, tinActual: 4, tinNuevo: 3, mesesRestantes: 300, tipo: 'variable', aniosDesdeFirma: 6, tasacion: 350, otros: 300 }, V);
    expect(s.comision).toBe(0);
    expect(s.ahorroMes).toBeGreaterThan(70);
    expect(s.neto).toBeGreaterThan(0);
  });
});

describe('fija o variable', () => {
  it('si el Euríbor sube, la variable cuesta más; el equilibrio está entre los escenarios', () => {
    const r = fijaOVariable({ capital: 180000, anios: 25, tinFijo: 3.03, tinInicial: 2.97, diferencial: 0.6, euribor: 2.5, paso: 1 });
    const [baja, igual, sube] = r.escenarios;
    expect(baja.intereses).toBeLessThan(igual.intereses);
    expect(sube.intereses).toBeGreaterThan(igual.intereses);
    const v = hipotecaVariable(180000, 25, { tinFijo: 2.97, aniosFijos: 1, diferencial: 0.6, euriborAnio: () => r.euriborEquilibrio });
    expect(Math.abs(v.intereses - r.fija.intereses)).toBeLessThan(50);
  });
});

describe('plusvalía municipal', () => {
  const coefs = V.plusvalia_municipal.coeficientes_maximos_vigentes.por_anios;
  it('coeficientes vigentes de 2024', () => {
    expect(coeficientePlusvalia(coefs, 0)).toBe(0.15);
    expect(coeficientePlusvalia(coefs, 7)).toBe(0.2);
    expect(coeficientePlusvalia(coefs, 25)).toBe(0.4);
    expect(coeficientePlusvalia(V.plusvalia_municipal.coeficientes_rdl_29_2026.conocidos, 5)).toBeNull();
  });
  it('se paga el método más barato', () => {
    const r = plusvalia({ vcSuelo: 40000, vcTotal: 100000, compra: 150000, venta: 200000, anios: 10, tipoPct: 30, coeficiente: 0.12 });
    expect(r.objetiva).toBe(1440);
    expect(r.real).toBe(6000);
    expect(r.aPagar).toBe(1440);
    expect(r.metodo).toBe('objetiva');
  });
  it('sin ganancia no hay impuesto', () => {
    expect(plusvalia({ vcSuelo: 40000, vcTotal: 100000, compra: 200000, venta: 190000, anios: 5, tipoPct: 30, coeficiente: 0.18 }).aPagar).toBe(0);
  });
});

describe('alquiler', () => {
  it('actualización con el IRAV', () => expect(actualizarRenta(900, 2.54)).toBe(922.86));
  it('rentabilidad bruta y neta', () => {
    const r = rentabilidad({ precio: 200000, gastosCompra: 20000, rentaMes: 1000, ibi: 400, comunidad: 600, seguro: 200, mantenimientoPct: 5, vacioMeses: 0, intereses: 0, prestamo: 0, pctConstruccion: 60, amortizacionPct: 3 });
    expect(r.bruta).toBeCloseTo(5.45, 2);
    expect(r.neta).toBeCloseTo((12000 - 1800) / 220000 * 100, 2);
    expect(r.amortizacion).toBe(3960);
  });
  it('alquilar o comprar devuelve una fila por año', () => {
    const r = alquilarOComprar({ precio: 250000, gastos: 25000, financiacionPct: 80, tin: 3, aniosHipoteca: 30, costesAnuales: 2000, alquilerMes: 1000, subidaAlquilerPct: 2.5, revalorizacionPct: 2, rentabilidadPct: 4, horizonte: 15 });
    expect(r.filas).toHaveLength(15);
    expect(Number.isFinite(r.diferencia)).toBe(true);
  });
});

// La calculadora publicada (no solo el motor) da la cifra del ejemplo de la definición
describe('simulador de hipoteca (calculadora)', () => {
  const defs = import.meta.glob('../src/calculadoras/viv-simulador-hipoteca.ts', { eager: true, import: 'default' }) as Record<string, any>;
  const d = defs['../src/calculadoras/viv-simulador-hipoteca.ts'];
  it('150.000 € a 30 años al 3,01 % fijo: 633,22 €/mes y 77.957,52 € de intereses', () => {
    const r = d.calcular({ importe: 150000, anios: 30, modo: 'fijo', tin: 3.01, aniosFijos: 5, euribor: 3, diferencial: 0.6 }, { P, lang: 'es', pais: 'es' });
    expect(r.destacado.v).toBeCloseTo(633.22, 2);
    expect(r.secundarios[0].v).toBeCloseTo(77957.52, 0);
    expect(r.tablas[0].filas).toHaveLength(30);
  });
  it('variable con Euríbor 3,247 % + 0,60 a 25 años sobre 150.000 €: 779,14 €', () => {
    const r = d.calcular({ importe: 150000, anios: 25, modo: 'variable', tin: 3, aniosFijos: 5, euribor: 3.247, diferencial: 0.6 }, { P, lang: 'es', pais: 'es' });
    expect(r.destacado.v).toBeCloseTo(779.14, 2);
  });
});
