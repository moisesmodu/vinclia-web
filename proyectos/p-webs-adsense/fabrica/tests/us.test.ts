// Pruebas del motor de EE. UU. con cifras de 2026 calculadas a mano a partir de params/us/2026.
import { describe, it, expect } from 'vitest';
import { params, anios } from '../src/lib/params';
import {
  impuestoEscala, fica, impuestoAutonomo, creditoHijos, deduccionObbba, impuestoFederal, retencionFederal,
  impuestoEstatal, contribucionesEstatales, chequePago, horasExtra, horaAAnual, anualAHora, cuotaPrestamo, prestamo,
  tarjetaCredito, envioRemesa, cambioDivisa, ahorro401k, medicareAdicional,
} from '../src/lib/calc/us';

const P = params('us', 2026);
const F = P.fiscal, L = P.laboral;

describe('parámetros 2026', () => {
  it('hay años publicados y bloques completos', () => {
    expect(anios('us')).toContain(2026);
    expect(F.federal.deduccion_estandar).toEqual({ single: 16100, mfj: 32200, hoh: 24150, mfs: 16100 });
    expect(L.fica.tope_salarial).toBe(184500);
  });
  it('los tramos de cada estado civil son crecientes y acaban en null', () => {
    for (const ec of ['single', 'mfj', 'hoh', 'mfs']) {
      const t = F.federal.tramos[ec];
      expect(t[t.length - 1].hasta).toBeNull();
      for (let i = 1; i < t.length - 1; i++) expect(t[i].hasta).toBeGreaterThan(t[i - 1].hasta);
    }
  });
  it('los 15 estados pedidos tienen datos', () => {
    for (const e of ['CA', 'TX', 'FL', 'NY', 'IL', 'AZ', 'NJ', 'CO', 'NM', 'NV', 'GA', 'NC', 'WA', 'PA', 'MA']) {
      expect(F.estados[e], e).toBeTruthy();
      expect(L.salario_minimo.estados[e], e).toBeTruthy();
    }
  });
});

describe('impuesto federal por tramos', () => {
  it('soltero, 50.000 $ imponibles: 1.240 + 4.512 = 5.752 $', () => {
    const r = impuestoEscala(50000, 'single', F);
    expect(r.impuesto).toBeCloseTo(5752, 2);
    expect(r.marginal).toBe(12);
  });
  it('conjunta, 100.000 $ imponibles: 2.480 + 9.120 = 11.600 $', () => {
    expect(impuestoEscala(100000, 'mfj', F).impuesto).toBeCloseTo(11504, 2);
  });
  it('cabeza de familia, 60.000 $: 1.770 + 12 % de 42.300', () => {
    expect(impuestoEscala(60000, 'hoh', F).impuesto).toBeCloseTo(1770 + 42300 * 0.12, 2);
  });
  it('tipo marginal del 37 % por encima de 640.600 $ (soltero) y 384.350 $ (separado)', () => {
    expect(impuestoEscala(700000, 'single', F).marginal).toBe(37);
    expect(impuestoEscala(400000, 'mfs', F).marginal).toBe(37);
    expect(impuestoEscala(400000, 'single', F).marginal).toBe(35);
  });
});

describe('FICA y trabajo por cuenta propia', () => {
  it('60.000 $: 3.720 de Seguro Social y 870 de Medicare', () => {
    const r = fica(60000, L);
    expect(r.ss).toBeCloseTo(3720, 2);
    expect(r.medicare).toBeCloseTo(870, 2);
    expect(r.adicional).toBe(0);
  });
  it('250.000 $: Seguro Social topado en 11.439 $ y 0,9 % adicional sobre 50.000 $', () => {
    const r = fica(250000, L);
    expect(r.ss).toBeCloseTo(11439, 2);
    expect(r.medicare).toBeCloseTo(3625, 2);
    expect(r.adicional).toBeCloseTo(450, 2);
  });
  it('self-employment de 50.000 $: base 46.175 y 7.064,78 $', () => {
    const r = impuestoAutonomo(50000, L);
    expect(r.base).toBeCloseTo(46175, 2);
    expect(r.total).toBeCloseTo(5725.7 + 1339.08, 1);
    expect(r.deducible).toBeCloseTo(r.total / 2, 1);
  });
  it('sin impuesto por debajo de 400 $ y tope reducido por salarios W-2', () => {
    expect(impuestoAutonomo(350, L).total).toBe(0);
    const r = impuestoAutonomo(50000, L, 180000);
    expect(r.ss).toBeCloseTo(4500 * 0.124, 2);
  });
  it('Medicare adicional en la declaración: conjunta a partir de 250.000 $', () => {
    expect(medicareAdicional(260000, 0, 'mfj', L)).toBeCloseTo(90, 2);
    expect(medicareAdicional(260000, 0, 'single', L)).toBeCloseTo(540, 2);
  });
});

describe('créditos y deducciones', () => {
  it('2 hijos con poco impuesto: 1.000 no reembolsable + 3.400 reembolsable', () => {
    const r = creditoHijos({ hijos: 2, agi: 60000, ingresoGanado: 60000, impuesto: 1000, ec: 'mfj' }, F);
    expect(r.noReembolsable).toBe(1000);
    expect(r.reembolsable).toBe(3400);
    expect(r.total).toBe(4400);
  });
  it('parte reembolsable limitada al 15 % de lo ganado por encima de 2.500 $', () => {
    const r = creditoHijos({ hijos: 1, agi: 10000, ingresoGanado: 10000, impuesto: 0, ec: 'single' }, F);
    expect(r.reembolsable).toBeCloseTo(1125, 2);
  });
  it('se reduce 50 $ por cada 1.000 $ (o fracción) sobre 200.000 $', () => {
    const r = creditoHijos({ hijos: 1, agi: 210500, ingresoGanado: 210500, impuesto: 40000, ec: 'single' }, F);
    expect(r.reduccion).toBe(550);
    expect(r.total).toBe(1650);
  });
  it('deducción por propinas: tope 25.000 y reducción de 100 $ por cada 1.000 $ sobre 150.000 $', () => {
    expect(deduccionObbba('propinas', 30000, 100000, 'single', F, 2026).deduccion).toBe(25000);
    expect(deduccionObbba('propinas', 30000, 160000, 'single', F, 2026).deduccion).toBe(24000);
    expect(deduccionObbba('propinas', 5000, 100000, 'mfs', F, 2026).excluido).toBe(true);
    expect(deduccionObbba('propinas', 5000, 100000, 'single', F, 2029).vigente).toBe(false);
  });
  it('deducción por horas extra: 12.500 $ (25.000 $ en conjunta)', () => {
    expect(deduccionObbba('horas_extra', 20000, 90000, 'single', F, 2026).deduccion).toBe(12500);
    expect(deduccionObbba('horas_extra', 20000, 90000, 'mfj', F, 2026).deduccion).toBe(20000);
  });
});

describe('declaración federal anual', () => {
  it('soltero con 60.000 $ de salario y 6.000 retenidos', () => {
    const r = impuestoFederal({ ec: 'single', salarios: 60000, retenido: 6000, anio: 2026 }, P);
    expect(r.imponible).toBe(43900);
    expect(r.impuestoEscala).toBeCloseTo(1240 + 31500 * 0.12, 2); // 5.020
    expect(r.resultado).toBeCloseTo(980, 2);
    expect(r.marginal).toBe(12);
    expect(r.tipoEfectivo).toBeCloseTo(5020 / 60000 * 100, 1);
  });
  it('conjunta con 2 hijos y 70.000 $: el crédito anula el impuesto y devuelve parte', () => {
    const r = impuestoFederal({ ec: 'mfj', salarios: 70000, hijos: 2, retenido: 2000, anio: 2026 }, P);
    expect(r.imponible).toBe(37800);
    expect(r.impuestoEscala).toBeCloseTo(2480 + 13000 * 0.12, 2); // 4.040
    expect(r.impuestoRenta).toBe(0);
    expect(r.ctc.reembolsable).toBeCloseTo(360, 2); // 4.400 − 4.040
    expect(r.resultado).toBeCloseTo(2360, 2);
  });
  it('1099 de 50.000 $: self-employment, mitad deducible y QBI', () => {
    const r = impuestoFederal({ ec: 'single', gananciaAutonomo: 50000, anio: 2026 }, P);
    const se = 7064.78, ded = se / 2;
    expect(r.agi).toBeCloseTo(50000 - ded, 0);
    const antes = 50000 - ded - 16100;
    expect(r.qbi).toBeCloseTo(antes * 0.2, 0);
    expect(r.impuestoTotal).toBeGreaterThan(se);
  });
  it('las propinas reducen la renta imponible', () => {
    const sin = impuestoFederal({ ec: 'single', salarios: 40000, anio: 2026 }, P);
    const con = impuestoFederal({ ec: 'single', salarios: 40000, propinas: 10000, anio: 2026 }, P);
    expect(sin.imponible - con.imponible).toBe(10000);
  });
});

describe('retención W-4', () => {
  it('soltero, 60.000 $ al año, quincenal: 5.020 $ al año', () => {
    const r = retencionFederal({ salarioAnual: 60000, ec: 'single', periodos: 26 }, F);
    expect(r.porPeriodo).toBeCloseTo(5020 / 26, 2);
  });
  it('la casilla del paso 2 retiene más', () => {
    const a = retencionFederal({ salarioAnual: 60000, ec: 'mfj', periodos: 26 }, F);
    const b = retencionFederal({ salarioAnual: 60000, ec: 'mfj', paso2: true, periodos: 26 }, F);
    expect(b.anual).toBeGreaterThan(a.anual);
  });
  it('el paso 3 resta los créditos por dependientes', () => {
    const r = retencionFederal({ salarioAnual: 60000, ec: 'single', paso3: 2200, periodos: 12 }, F);
    expect(r.anual).toBeCloseTo(5020 - 2200, 0);
  });
});

describe('impuesto estatal', () => {
  it('estados sin impuesto', () => {
    for (const e of ['TX', 'FL', 'NV', 'WA']) expect(impuestoEstatal({ estado: e, ec: 'single', agi: 80000 }, F).impuesto).toBe(0);
  });
  it('Illinois: 4,95 % tras la exención de 2.925 $', () => {
    expect(impuestoEstatal({ estado: 'IL', ec: 'single', agi: 50000 }, F).impuesto).toBeCloseTo((50000 - 2925) * 0.0495, 2);
  });
  it('Carolina del Norte: 3,99 % tras 12.750 $', () => {
    expect(impuestoEstatal({ estado: 'NC', ec: 'single', agi: 50000 }, F).impuesto).toBeCloseTo(37250 * 0.0399, 1);
  });
  it('Pensilvania: 3,07 % del bruto', () => {
    expect(impuestoEstatal({ estado: 'PA', ec: 'single', agi: 45000, salarioBruto: 50000 }, F).impuesto).toBeCloseTo(1535, 2);
  });
  it('California, soltero con 50.000 $: 973,08 $', () => {
    // 44.100 imponibles: 114,56 + 314,02 + 628,16 + 74,34 − 158 de crédito personal
    expect(impuestoEstatal({ estado: 'CA', ec: 'single', agi: 50000 }, F).impuesto).toBeCloseTo(973.08, 1);
  });
  it('Nueva York, soltero con 60.000 $', () => {
    const imp = 8500 * 0.039 + 3200 * 0.044 + 2200 * 0.0515 + (52000 - 13900) * 0.054;
    expect(impuestoEstatal({ estado: 'NY', ec: 'single', agi: 60000 }, F).impuesto).toBeCloseTo(imp, 1);
  });
  it('Nueva Jersey: cabeza de familia usa la tabla de conjunta', () => {
    const r = impuestoEstatal({ estado: 'NJ', ec: 'hoh', agi: 60000, dependientes: 1 }, F);
    const imponible = 60000 - 1000 - 1500;
    expect(r.impuesto).toBeCloseTo(20000 * 0.014 + 30000 * 0.0175 + (imponible - 50000) * 0.0245, 1);
  });
  it('Colorado: 4,4 % de la renta imponible federal', () => {
    expect(impuestoEstatal({ estado: 'CO', ec: 'single', agi: 60000, imponibleFederal: 43900 }, F).impuesto).toBeCloseTo(1931.6, 1);
  });
  it('Massachusetts: sobretasa del 4 % para millonarios', () => {
    const r = impuestoEstatal({ estado: 'MA', ec: 'single', agi: 2000000 }, F);
    expect(r.marginal).toBe(9);
  });
  it('SDI de California 1,3 % y tope semanal en Nueva York', () => {
    expect(contribucionesEstatales('CA', 60000, L)[0].importe).toBeCloseTo(780, 2);
    expect(contribucionesEstatales('NY', 60000, L)[0].importe).toBeCloseTo(31.2, 2);
  });
});

describe('cheque de pago', () => {
  it('Texas, 52.000 $ semanal soltero: solo federal y FICA', () => {
    const r = chequePago({ brutoAnual: 52000, periodos: 52, ec: 'single', estado: 'TX' }, P);
    expect(r.brutoPeriodo).toBe(1000);
    expect(r.porPeriodo.estatal).toBe(0);
    expect(r.porPeriodo.ss).toBeCloseTo(62, 2);
    expect(r.porPeriodo.medicare).toBeCloseTo(14.5, 2);
    const fed = (1240 + (52000 - 16100 - 12400) * 0.12) / 52;
    expect(r.porPeriodo.federal).toBeCloseTo(fed, 1);
    expect(r.porPeriodo.neto).toBeCloseTo(1000 - 62 - 14.5 - fed, 1);
  });
  it('California descuenta impuesto estatal y SDI; el 401(k) baja la retención', () => {
    const a = chequePago({ brutoAnual: 60000, periodos: 26, ec: 'single', estado: 'CA' }, P);
    const b = chequePago({ brutoAnual: 60000, periodos: 26, ec: 'single', estado: 'CA', pct401k: 10 }, P);
    expect(a.porPeriodo.estatal).toBeGreaterThan(0);
    expect(a.contribTotal).toBeCloseTo(780, 2);
    expect(b.porPeriodo.federal).toBeLessThan(a.porPeriodo.federal);
    expect(b.fica.total).toBe(a.fica.total);
  });
  it('en Pensilvania el 401(k) no baja el impuesto estatal', () => {
    const a = chequePago({ brutoAnual: 60000, periodos: 12, ec: 'single', estado: 'PA' }, P);
    const b = chequePago({ brutoAnual: 60000, periodos: 12, ec: 'single', estado: 'PA', pct401k: 10 }, P);
    expect(b.estatal.impuesto).toBe(a.estatal.impuesto);
  });
});

describe('horas, horas extra y finanzas', () => {
  it('20 $ la hora a 40 h son 41.600 $ al año', () => {
    expect(horaAAnual(20, 40).anual).toBe(41600);
    expect(anualAHora(50000, 40)).toBeCloseTo(24.04, 2);
  });
  it('FLSA: 45 h a 20 $ = 800 + 150', () => {
    const r = horasExtra({ tarifa: 20, horasSemana: 45 }, L);
    expect(r.total).toBe(950);
    expect(r.prima).toBe(50);
  });
  it('California: 4 días de 10 h generan 8 h extra diarias aunque la semana tenga 40', () => {
    const r = horasExtra({ tarifa: 20, horasSemana: 40, estado: 'CA', horasDia: [10, 10, 10, 10] }, L);
    expect(r.extra).toBe(8);
    expect(r.total).toBe(32 * 20 + 8 * 30);
    expect(r.prima).toBe(0); // la deducción federal solo cubre lo que pasa de 40 h semanales
  });
  it('préstamo de 30.000 $ al 7 % en 60 meses: 594,04 $ al mes', () => {
    expect(cuotaPrestamo(30000, 7, 60)).toBeCloseTo(594.04, 2);
    const p = prestamo(30000, 7, 60);
    expect(p.intereses).toBeCloseTo(594.04 * 60 - 30000, 0);
    expect(p.anual.length).toBe(5);
  });
  it('tarjeta de 5.000 $ al 24 % pagando 200 $: 36 meses', () => {
    const r = tarjetaCredito(5000, 24, 200);
    expect(r.meses).toBe(36);
    expect(r.interesMes1).toBe(100);
    expect(tarjetaCredito(5000, 24, 90).nuncaTermina).toBe(true);
  });
  it('remesa de 500 $ en efectivo: 1 % de impuesto y coste del tipo de cambio', () => {
    const r = envioRemesa({ monto: 500, comision: 5, tasaOfrecida: 17.5, tasaReferencia: 18, efectivo: true }, F);
    expect(r.impuesto).toBe(5);
    expect(r.recibe).toBe(8750);
    expect(r.costeTipo).toBeCloseTo(13.89, 2);
    expect(r.costeTotal).toBeCloseTo(23.89, 2);
    expect(envioRemesa({ monto: 500, comision: 5, tasaOfrecida: 17.5, tasaReferencia: 18, efectivo: false }, F).impuesto).toBe(0);
  });
  it('cambio de divisa con margen del 2 %', () => {
    const r = cambioDivisa({ monto: 100, tasa: 18, margenPct: 2, comision: 0 });
    expect(r.tasaEfectiva).toBeCloseTo(17.64, 4);
    expect(r.recibe).toBe(1764);
  });
  it('401(k): el aporte se limita a 24.500 $ y sube con la recuperación a los 50', () => {
    const r = ahorro401k({ salario: 300000, pct: 20, matchPct: 0, matchTope: 0, saldo: 0, rentabilidad: 0, anios: 1, edad: 40, marginal: 24 }, F);
    expect(r.aporteAnio1).toBe(24500);
    const s = ahorro401k({ salario: 300000, pct: 20, matchPct: 0, matchTope: 0, saldo: 0, rentabilidad: 0, anios: 1, edad: 61, marginal: 24 }, F);
    expect(s.aporteAnio1).toBe(35750);
  });
});
