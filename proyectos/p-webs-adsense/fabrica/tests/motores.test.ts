import { describe, it, expect } from 'vitest';
import { params } from '../src/lib/params';
import { cuotaEscala } from '../src/lib/calc/base';
import { cotizacion } from '../src/lib/calc/ss';
import { retencion, cuotaAnual, reduccionTrabajo } from '../src/lib/calc/irpf';
import { sueldoNeto, indemnizacion, paro, porcentajePension, jubilacion, cuotaAutonomos, finiquito } from '../src/lib/calc/laboral';
import { recargoExtemporaneo, factura, modelo303 } from '../src/lib/calc/fiscal';

const P = params('es', 2026);
const P27 = params('es', 2027);

describe('escalas', () => {
  it('escala estatal: cuota hasta 60.000 €', () => {
    // 12450*9.5% + 7750*12% + 15000*15% + 24800*18.5% = 1182.75+930+2250+4588 = 8950.75
    expect(cuotaEscala(60000, P.fiscal.irpf.escala_estatal)).toBeCloseTo(8950.75, 2);
  });
  it('Cataluña: cuota en 175.000 € coincide con la AEAT (36.415 €)', () => {
    expect(cuotaEscala(175000, P.fiscal.irpf.escalas_autonomicas.CT.escala)).toBeCloseTo(36415, 0);
  });
});

describe('Seguridad Social', () => {
  it('trabajador indefinido 2026: 6,50 %', () => {
    const r = cotizacion({ brutoAnual: 30000 }, P.laboral);
    expect(r.trabajador.tipo).toBeCloseTo(6.5, 2);
    expect(r.trabajador.mensual).toBeCloseTo(2500 * 0.065, 2);
  });
  it('base mínima y máxima', () => {
    expect(cotizacion({ brutoAnual: 10000 }, P.laboral).base).toBe(1424.4);
    expect(cotizacion({ brutoAnual: 90000 }, P.laboral).base).toBe(5101.2);
    expect(cotizacion({ brutoAnual: 90000 }, P.laboral).trabajador.solidaridadMensual).toBeGreaterThan(0);
  });
  it('MEI 2027 sube al 0,17 % del trabajador', () => {
    expect(cotizacion({ brutoAnual: 30000 }, P27.laboral).trabajador.tipo).toBeCloseTo(6.52, 2);
  });
});

describe('IRPF', () => {
  it('reducción por rendimientos del trabajo', () => {
    expect(reduccionTrabajo(14000, P.fiscal)).toBe(7302);
    expect(reduccionTrabajo(30000, P.fiscal)).toBe(0);
    expect(reduccionTrabajo(19747.5, P.fiscal)).toBeCloseTo(0, 0);
  });
  it('el SMI 2026 soporta unos 37 € de retención por paga (límite del 43 %), recuperables en la renta', () => {
    const ss = cotizacion({ brutoAnual: 17094 }, P.laboral).trabajador.anual;
    const r = retencion({ brutoAnual: 17094, ssAnual: ss }, P.fiscal);
    expect(r.limite43).toBe(true);
    expect(r.importe / 14).toBeGreaterThan(35);
    expect(r.importe / 14).toBeLessThan(39);
    expect(retencion({ brutoAnual: 15000, ssAnual: 975 }, P.fiscal).tipo).toBe(0);
  });
  it('30.000 € soltero sin hijos: retención entre 14 % y 17 %', () => {
    const ss = cotizacion({ brutoAnual: 30000 }, P.laboral).trabajador.anual;
    const r = retencion({ brutoAnual: 30000, ssAnual: ss }, P.fiscal);
    expect(r.tipo).toBeGreaterThan(14);
    expect(r.tipo).toBeLessThan(17);
  });
  it('los hijos bajan la retención', () => {
    const ss = cotizacion({ brutoAnual: 30000 }, P.laboral).trabajador.anual;
    const a = retencion({ brutoAnual: 30000, ssAnual: ss }, P.fiscal).tipo;
    const b = retencion({ brutoAnual: 30000, ssAnual: ss, hijos: 2 }, P.fiscal).tipo;
    expect(b).toBeLessThan(a);
  });
  it('cuota anual: Madrid paga menos que Cataluña a 40.000 €', () => {
    const md = cuotaAnual({ baseGeneral: 36000, ccaa: 'MD' }, P.fiscal).total;
    const ct = cuotaAnual({ baseGeneral: 36000, ccaa: 'CT' }, P.fiscal).total;
    expect(md).toBeLessThan(ct);
  });
  it('Ceuta y Melilla: bonificación del 60 %', () => {
    const ce = cuotaAnual({ baseGeneral: 30000, ccaa: 'CE_ML' }, P.fiscal).total;
    const cm = cuotaAnual({ baseGeneral: 30000, ccaa: 'CM' }, P.fiscal).total;
    expect(ce).toBeLessThan(cm * 0.45);
  });
  it('quien cobra el SMI no paga IRPF en la renta (deducción RDL 5/2026)', () => {
    const r = sueldoNeto({ brutoAnual: 17094, pagas: 14, ccaa: 'CT' }, P);
    expect(r.renta!.cuota).toBe(0);
  });
});

describe('neto', () => {
  it('neto coherente: bruto = neto + SS + IRPF', () => {
    const r = sueldoNeto({ brutoAnual: 35000, pagas: 14, ccaa: 'CT' }, P);
    expect(r.netoAnual + r.ss.trabajador.anual + r.ret.importe).toBeCloseTo(35000, 1);
    expect(r.netoOrdinaria * 12 + r.netoExtra * 2).toBeCloseTo(r.netoAnual, 0);
  });
});

describe('laboral', () => {
  it('despido improcedente 10 años exactos: 330 días', () => {
    const r = indemnizacion({ inicio: '2014-01-01', fin: '2023-12-31', brutoAnual: 36500, tipo: 'improcedente' }, P.laboral);
    expect(r.dias).toBeCloseTo(330, 1);
    expect(r.importe).toBeCloseTo(33000, 0);
  });
  it('despido improcedente con tramo anterior a 2012', () => {
    const r = indemnizacion({ inicio: '2002-02-12', fin: '2026-02-11', brutoAnual: 36500, tipo: 'improcedente' }, P.laboral);
    expect(r.tramos.length).toBe(2);
    expect(r.dias).toBeLessThanOrEqual(1260);
    expect(r.dias).toBeGreaterThanOrEqual(720);
  });
  it('objetivo con tope de 12 mensualidades', () => {
    const r = indemnizacion({ inicio: '2000-01-01', fin: '2026-01-01', brutoAnual: 36500, tipo: 'objetivo' }, P.laboral);
    expect(r.dias).toBe(360);
  });
  it('paro: 1.100 días → 360 días de prestación', () => {
    const r = paro({ diasCotizados: 1100, baseMensual: 1900, hijos: 0 }, P.laboral);
    expect(r.duracion).toBe(360);
    expect(r.periodos[0].mensualBruto).toBeCloseTo(1225, 0); // 70 % de 1.900 = 1.330 → tope 1.225
  });
  it('pensión: 37 años en 2027 = 100 %', () => {
    expect(porcentajePension(37 * 12, P27.laboral)).toBe(100);
    expect(porcentajePension(15 * 12, P27.laboral)).toBe(50);
  });
  it('jubilación: nacido en 1962 con 30 años cotizados → 67 años', () => {
    const r = jubilacion({ nacimiento: '1962-03-10', cotizadoMeses: 360, fechaCotizado: '2026-10-28', sigueCotizando: false });
    expect(r.edadAnios).toBe(67);
  });
  it('jubilación: con 40 años cotizados → 65', () => {
    expect(jubilacion({ nacimiento: '1962-03-10', cotizadoMeses: 480, fechaCotizado: '2026-10-28', sigueCotizando: false }).edadAnios).toBe(65);
  });
  it('autónomos: tramo 1 = 205,88 €', () => {
    expect(cuotaAutonomos({ rendimientoAnual: 6000 }, P.laboral).cuota).toBeCloseTo(205.88, 2);
  });
  it('finiquito sin pagas pendientes en 12 pagas', () => {
    const r = finiquito({ salarioMensual: 1500, pagas: 12, inicioContrato: '2025-01-01', fin: '2026-06-30', vacacionesDisfrutadas: 10 }, P.laboral);
    expect(r.extras.length).toBe(0);
    expect(r.vacacionesPendientes).toBeCloseTo(30 * 181 / 365 - 10, 1);
  });
});

describe('fiscal', () => {
  it('factura 1.000 € con 21 % IVA y 15 % retención = 1.060 €', () => {
    expect(factura({ base: 1000, tipoIva: 21, retencion: 15, recargo: false }, P.fiscal).total).toBe(1060);
  });
  it('303', () => {
    expect(modelo303({ ventas: [{ base: 10000, tipo: 21 }], soportado: 500, compensar: 0, trimestre: 1 }).resultado).toBe(1600);
  });
  it('recargo: 3 meses completos = 4 %', () => {
    const r = recargoExtemporaneo({ cuota: 1000, finPlazo: '2026-01-30', presentacion: '2026-05-15', reduccion: false }, P.fiscal);
    expect(r.pct).toBe(4);
  });
});
