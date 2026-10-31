// Productos de pago (productos.json): las fórmulas de cada Excel reproducen los motores de la web.
// Cada caso rellena el libro con openpyxl, lo recalcula con LibreOffice (scripts/productos/verificar.py) y compara
// los resultados con las funciones de src/lib/calc con los mismos parámetros. Sin LibreOffice, se saltan.
import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { params } from '../src/lib/params';
import { modelo303, modelo130 } from '../src/lib/calc/fiscal';
import { cuotaAutonomos, netoAutonomo, finiquito, indemnizacion } from '../src/lib/calc/laboral';
import { cuota as cuotaHipoteca, tae, hipotecaFija, hipotecaVariable, amortizacionAnticipada, topeComision } from '../src/lib/calc/vivienda';
import { impuestoFederal, impuestoEstatal, type EstadoCivil } from '../src/lib/calc/us';

const productos = JSON.parse(readFileSync('productos.json', 'utf8')).productos as any[];
const hayLibreOffice = spawnSync('soffice', ['--version']).status === 0 && spawnSync('python3', ['-c', 'import openpyxl']).status === 0;
const xlsx = (id: string) => `productos/${id}/${productos.find((p) => p.id === id).archivos.find((a: any) => a.tipo === 'xlsx').archivo}`;

type Caso = { id: string; xlsx: string; poner: Record<string, unknown>; leer: string[] };
function recalcular(casos: Caso[]): Record<string, Record<string, any>> {
  const dir = mkdtempSync(join(tmpdir(), 'productos-'));
  const f = join(dir, 'casos.json');
  writeFileSync(f, JSON.stringify(casos));
  const out = execFileSync('python3', ['scripts/productos/verificar.py', f], { encoding: 'utf8', maxBuffer: 1e8, timeout: 600000 });
  return Object.fromEntries(JSON.parse(out).map((r: any) => [r.id, r.valores]));
}

describe('productos.json', () => {
  it('cada producto tiene sitio, precio, token largo, variable de pago y archivos generados', () => {
    const tokens = new Set<string>();
    for (const p of productos) {
      expect(existsSync(`sitios/${p.sitio}/sitio.json`)).toBe(true);
      expect(p.precio).toBeGreaterThan(0);
      expect(p.token).toMatch(/^[A-Za-z0-9]{32,}$/);
      expect(tokens.has(p.token)).toBe(false);
      tokens.add(p.token);
      expect(p.variablePago).toBe(`PAGO_${p.id.toUpperCase().replace(/-/g, '_')}_URL`);
      const sitio = JSON.parse(readFileSync(`sitios/${p.sitio}/sitio.json`, 'utf8'));
      for (const c of p.calculadoras) expect(sitio.calculadoras).toContain(c);
      for (const l of sitio.idiomas) expect(p.nombre[l] && p.ruta[l] && p.frase[l] && p.cta[l]).toBeTruthy();
      for (const a of p.archivos) expect(existsSync(`productos/${p.id}/${a.archivo}`), a.archivo).toBe(true);
    }
  });
});

describe('venta: enlace de pago y bloque bajo el resultado', () => {
  it('sin Payment Link no se ofrece; con uno válido de Stripe, sí; con otro dominio, no', async () => {
    const { productoPara, enlacePago, producto } = await import('../src/lib/productos');
    const p = producto('pack-despido')!; // las pruebas compilan como NetoClaro
    delete process.env[p.variablePago];
    expect(productoPara('finiquito')).toBeNull();
    process.env[p.variablePago] = 'https://ejemplo.com/pagar';
    expect(enlacePago(p)).toBe('');
    process.env[p.variablePago] = 'https://buy.stripe.com/test_00w8wIaaN6wyfbv1bJbEA04';
    expect(productoPara('finiquito')?.id).toBe('pack-despido');
    expect(productoPara('sueldo-neto')).toBeNull();
    delete process.env[p.variablePago];
  });
});

/* ------------------------------------------------------------------ Kit del autónomo 2027 */

const P27 = params('es', 2027);
type Ing = [string, number, number, number]; // fecha, base, IVA %, retención %
type Gas = [string, number, number, '' | 'No', number]; // fecha, base, IVA %, ¿deducible?, % afectación
interface CasoKit { id: string; ccaa: string; edad: number; hijos: number; hijos3: number; hijos100: boolean; tarifaPlana: boolean; rendAnterior: number; compensar: number; ing: Ing[]; gas: Gas[] }
const KIT: CasoKit[] = [
  { id: 'kit-cataluna', ccaa: 'CT', edad: 38, hijos: 0, hijos3: 0, hijos100: false, tarifaPlana: false, rendAnterior: 20000, compensar: 0,
    ing: [['2027-01-15', 1800, 21, 15], ['2027-02-10', 2950, 21, 15], ['2027-03-28', 420, 21, 0], ['2027-04-22', 3600, 21, 15], ['2027-05-30', 2400, 21, 15], ['2027-08-18', 3780, 21, 15], ['2027-09-09', 1600, 21, 7], ['2027-10-14', 4650, 21, 15], ['2027-12-20', 2100, 21, 15]],
    gas: [['2027-01-03', 72.6, 21, '', 100], ['2027-01-31', 49.5, 21, '', 50], ['2027-02-14', 35, 21, 'No', 100], ['2027-05-12', 289, 21, '', 100], ['2027-07-04', 120, 21, '', 100], ['2027-11-15', 180, 0, '', 100]] },
  { id: 'kit-madrid-tarifa-plana', ccaa: 'MD', edad: 67, hijos: 2, hijos3: 1, hijos100: false, tarifaPlana: true, rendAnterior: 9500, compensar: 0,
    ing: [['2027-01-20', 900, 10, 0], ['2027-02-11', 1200, 21, 15], ['2027-03-05', 300, 4, 0], ['2027-04-17', 800, 21, 15], ['2027-06-30', 650, 10, 0], ['2027-07-21', 1500, 21, 15], ['2027-11-02', 2200, 21, 15]],
    gas: [['2027-02-01', 400, 21, '', 100], ['2027-04-10', 5200, 21, '', 100], ['2027-05-22', 60, 21, 'No', 100], ['2027-08-08', 300, 10, '', 50], ['2027-12-01', 95, 21, '', 100]] },
  { id: 'kit-ceuta-melilla-devolucion', ccaa: 'CE_ML', edad: 45, hijos: 1, hijos3: 0, hijos100: true, tarifaPlana: false, rendAnterior: 60000, compensar: 300,
    ing: [['2027-01-31', 9000, 21, 0], ['2027-03-15', 8000, 21, 0], ['2027-05-15', 12000, 21, 0], ['2027-06-15', 6500, 10, 0], ['2027-09-30', 15000, 21, 0], ['2027-10-10', 4000, 21, 0], ['2027-12-15', 3000, 4, 0]],
    gas: [['2027-02-10', 1500, 21, '', 100], ['2027-06-01', 2200, 21, '', 100], ['2027-10-20', 18000, 21, '', 100], ['2027-11-11', 900, 21, 'No', 80]] },
];

const trim = (f: string) => Math.ceil(+f.slice(5, 7) / 3);
const ivaDed = (g: Gas) => (g[3] === 'No' ? 0 : (g[1] * g[2] / 100) * g[4] / 100);
const gasIrpf = (g: Gas) => g[1] * g[4] / 100 + (g[3] === 'No' ? (g[1] * g[2] / 100) * g[4] / 100 : 0);
const retEur = (i: Ing) => Math.round(i[1] * i[3]) / 100;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe.skipIf(!hayLibreOffice)('Kit del autónomo 2027: el Excel reproduce los motores', () => {
  let R: Record<string, Record<string, any>> = {};
  const leer = ['RES_303_1', 'RES_303_2', 'RES_303_3', 'RES_303_4', 'RES_130_1', 'RES_130_2', 'RES_130_3', 'RES_130_4', 'PAGO_130_1', 'PAGO_130_2', 'PAGO_130_3', 'PAGO_130_4', 'TRAMO', 'CUOTA_PREVISTA', 'CUOTA_ANUAL', 'RENTA_TOTAL', 'RENTA_RESULTADO'];
  beforeAll(() => {
    R = recalcular(KIT.map((c) => {
      const poner: Record<string, unknown> = {
        CCAA_NOMBRE: P27.fiscal.irpf.escalas_autonomicas[c.ccaa].nombre, EDAD: c.edad, HIJOS: c.hijos, HIJOS3: c.hijos3, HIJOS100: c.hijos100 ? 'Sí' : 'No',
        TARIFA_PLANA: c.tarifaPlana ? 'Sí' : 'No', REND_ANTERIOR: c.rendAnterior, COMPENSAR_INICIAL: c.compensar,
      };
      c.ing.forEach((x, k) => { const r = 8 + k; Object.assign(poner, { [`Ingresos!B${r}`]: x[0], [`Ingresos!G${r}`]: x[1], [`Ingresos!H${r}`]: x[2], [`Ingresos!J${r}`]: x[3] }); });
      c.gas.forEach((x, k) => { const r = 8 + k; Object.assign(poner, { [`Gastos!B${r}`]: x[0], [`Gastos!H${r}`]: x[1], [`Gastos!I${r}`]: x[2], [`Gastos!K${r}`]: x[3] || null, [`Gastos!L${r}`]: x[4] }); });
      return { id: c.id, xlsx: xlsx('kit-autonomo-2027'), poner, leer };
    }));
  }, 600000);

  for (const c of KIT) {
    it(`${c.id}: 303, cuota de autónomos, 130 y renta`, () => {
      const r = R[c.id];
      // Modelo 303 trimestre a trimestre, con la compensación del anterior
      let comp = c.compensar;
      for (let q = 1; q <= 4; q++) {
        const ventas = c.ing.filter((x) => trim(x[0]) === q).map((x) => ({ base: x[1], tipo: x[2] }));
        const m = modelo303({ ventas, soportado: sum(c.gas.filter((g) => trim(g[0]) === q).map(ivaDed)), compensar: comp, trimestre: q });
        expect(r[`RES_303_${q}`], `303 ${q}T`).toBeCloseTo(m.resultado, 1);
        comp = Math.max(0, -m.resultado);
      }
      // Cuota de autónomos con el rendimiento de los libros
      const ing = sum(c.ing.map((x) => x[1])), gas = sum(c.gas.map(gasIrpf));
      const cu = cuotaAutonomos({ rendimientoAnual: Math.max(0, ing - gas), tarifaPlana: c.tarifaPlana }, P27.laboral);
      expect(r.TRAMO).toBe(cu.tramo);
      expect(r.CUOTA_PREVISTA).toBeCloseTo(cu.cuota, 1);
      expect(r.CUOTA_ANUAL).toBeCloseTo(cu.anual, 0);
      // Modelo 130 acumulado
      let pagados = 0;
      for (let q = 1; q <= 4; q++) {
        const m = modelo130({
          ingresosAcum: sum(c.ing.filter((x) => trim(x[0]) <= q).map((x) => x[1])),
          gastosAcum: sum(c.gas.filter((g) => trim(g[0]) <= q).map(gasIrpf)) + r.CUOTA_PREVISTA * 3 * q,
          retencionesAcum: sum(c.ing.filter((x) => trim(x[0]) <= q).map(retEur)), pagosAnteriores: pagados, trimestre: q, rendAnterior: c.rendAnterior,
        }, P27.fiscal);
        expect(r[`RES_130_${q}`], `130 ${q}T`).toBeCloseTo(m.resultado, 1);
        expect(r[`PAGO_130_${q}`]).toBeCloseTo(m.aIngresar, 1);
        pagados += m.aIngresar;
      }
      // Renta: mismo cálculo que la calculadora «sueldo neto autónomo»
      const n = netoAutonomo({ ingresos: ing, gastos: gas, ccaa: c.ccaa, tarifaPlana: c.tarifaPlana, edad: c.edad, hijos: c.hijos, hijosMenores3: c.hijos3, hijosEnteros: c.hijos100 }, P27);
      expect(r.RENTA_TOTAL).toBeCloseTo(n.irpf.total, 1);
      expect(r.RENTA_RESULTADO).toBeCloseTo(n.irpf.total - sum(c.ing.map(retEur)) - pagados, 1);
    });
  }
});

/* ------------------------------------------------------------------ Pack despido y finiquito */

const P26 = params('es', 2026);
const MOTIVOS: Record<string, string> = {
  temporal: 'Fin de contrato temporal (12 días por año)', objetivo: 'Despido objetivo o ERE (20 días por año)', improcedente: 'Despido improcedente (33 días; 45 antes de 2012)',
};
interface CasoDespido { id: string; sal: number; pagas: 12 | 14; inicio: string; fin: string; notif: string; disfrutadas: number; vac: number; devengo: 'semestral' | 'anual'; tipo: 'temporal' | 'objetivo' | 'improcedente'; bruto?: number; ccaa: string }
const DESPIDO: CasoDespido[] = [
  { id: 'despido-improcedente-cataluna', sal: 1600, pagas: 14, inicio: '2015-03-01', fin: '2026-11-15', notif: '2026-11-13', disfrutadas: 15, vac: 30, devengo: 'semestral', tipo: 'improcedente', ccaa: 'CT' },
  { id: 'despido-objetivo-tope-madrid', sal: 2400, pagas: 12, inicio: '2005-01-10', fin: '2026-06-30', notif: '2026-06-30', disfrutadas: 10, vac: 30, devengo: 'semestral', tipo: 'objetivo', ccaa: 'MD' },
  { id: 'despido-antes-2012-andalucia', sal: 2100, pagas: 14, inicio: '1994-09-01', fin: '2027-02-26', notif: '2027-02-25', disfrutadas: 0, vac: 31, devengo: 'anual', tipo: 'improcedente', bruto: 32000, ccaa: 'AN' },
];

describe.skipIf(!hayLibreOffice)('Pack despido: el Excel reproduce los motores', () => {
  let R: Record<string, Record<string, any>> = {};
  beforeAll(() => {
    const cal = JSON.parse(readFileSync('params/es/2027/calendario.json', 'utf8'));
    R = recalcular(DESPIDO.map((c) => ({
      id: c.id, xlsx: xlsx('pack-despido'),
      poner: { SAL: c.sal, PAGAS: c.pagas, INICIO: c.inicio, FIN: c.fin, NOTIFICACION: c.notif, DISFRUTADAS: c.disfrutadas, VAC: c.vac, DEVENGO: c.devengo === 'anual' ? 'Anual' : 'Semestral',
        MOTIVO: MOTIVOS[c.tipo], ...(c.bruto ? { BRUTO_INDEM: c.bruto } : {}), CCAA_NOMBRE: cal.comunidades[c.ccaa].n.es },
      leer: ['F_SALMES', 'F_VAC', 'F_VERANO', 'F_NAVIDAD', 'F_TOTAL', 'I_DIAS', 'I_IMPORTE', 'PLAZO_DESPIDO', 'PLAZO_PARO', 'TOTAL_CORRESPONDE'],
    })));
  }, 600000);

  for (const c of DESPIDO) {
    it(`${c.id}: finiquito, indemnización y plazo de 20 días hábiles`, async () => {
      const { sumarHabiles, lugarComunidad } = await import('../src/lib/calc/calendario');
      const r = R[c.id];
      const f = finiquito({ salarioMensual: c.sal, pagas: c.pagas, inicioContrato: c.inicio, fin: c.fin, vacacionesDisfrutadas: c.disfrutadas, diasVacacionesAnuales: c.vac, devengoExtras: c.devengo }, P26.laboral);
      expect(r.F_SALMES).toBeCloseTo(f.salarioMes, 2);
      expect(r.F_VAC).toBeCloseTo(f.importeVacaciones, 2);
      expect(r.F_VERANO + r.F_NAVIDAD).toBeCloseTo(f.totalExtras, 2);
      expect(r.F_TOTAL).toBeCloseTo(f.total, 2);
      const ind = indemnizacion({ inicio: c.inicio, fin: c.fin, brutoAnual: c.bruto ?? c.sal * c.pagas, tipo: c.tipo }, P26.laboral);
      expect(r.I_DIAS).toBeCloseTo(ind.dias, 2);
      expect(r.I_IMPORTE).toBeCloseTo(ind.importe, 2);
      expect(r.TOTAL_CORRESPONDE).toBeCloseTo(f.total + ind.importe, 1);
      expect(r.PLAZO_DESPIDO).toBe(sumarHabiles(lugarComunidad(c.ccaa), c.notif, P26.laboral.despido_plazos.caducidad_dias_habiles).fin);
      expect(r.PLAZO_PARO).toBe(sumarHabiles(lugarComunidad(c.ccaa), c.fin, P26.laboral.despido_plazos.paro_solicitud_dias_habiles).fin);
    });
  }
});

/* ------------------------------------------------------------------ Comparador de hipotecas */

const V27 = P27.vivienda;
const cerca = (a: number, b: number, tol: number) => expect(Math.abs(a - b), `${a} frente a ${b}`).toBeLessThan(tol);

describe.skipIf(!hayLibreOffice)('Comparador de hipotecas: el Excel reproduce los motores', () => {
  let R: Record<string, Record<string, any>> = {};
  const oferta = (j: number, o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [`OF_${k}_${j}`, v]));
  beforeAll(() => {
    const leer = ['CUOTA1_1', 'CUOTA2_1', 'TAE_1', 'COSTE_1', 'INTERESES_1', 'CUOTA1_2', 'CUOTA2_2', 'INTERESES_2', 'CA_INT_1', 'CA_PEND_10', 'AA_PENDIENTE', 'AA_CUOTACUOTA', 'AA_AHORROCUOTA', 'AA_MESESPLAZO', 'AA_AHORROPLAZO', 'AA_TOPEPCT', 'AA_COMISION'];
    R = recalcular([
      { id: 'hip-fija-vinculaciones', xlsx: xlsx('comparador-hipotecas'), leer,
        poner: { CAPITAL: 180000, PLAZO: 30, ...oferta(1, { BANCO: 'A', TIPO: 'Fija', TIN: 2.6, VIDA: 300, HOGAR: 250, TASACION: 350, APERTURA: 0 }) } },
      { id: 'hip-mixta-y-variable-euribor-sube', xlsx: xlsx('comparador-hipotecas'), leer,
        poner: { CAPITAL: 210000, PLAZO: 28, EURIBOR_HOY: 3, ESCENARIO: 'Sube 1 punto',
          ...oferta(1, { BANCO: 'Mixta', TIPO: 'Mixta', TIN: 2.2, ANIOS_INI: 5, DIF: 0.75 }), ...oferta(2, { BANCO: 'Variable', TIPO: 'Variable', TIN: 2.5, ANIOS_INI: 0, DIF: 0.9 }) } },
      { id: 'hip-amortizar-antes', xlsx: xlsx('comparador-hipotecas'), leer,
        poner: { CAPITAL: 220000, PLAZO: 25, ...oferta(1, { BANCO: 'Fija', TIPO: 'Fija', TIN: 3.1 }), AA_OFERTA: 1, AA_ANIO: 4, AA_IMPORTE: 30000 } },
    ]);
  }, 600000);

  it('fija con seguros: cuota, TAE con vinculaciones, coste total y cuadro anual', () => {
    const r = R['hip-fija-vinculaciones'];
    const n = 360, c = cuotaHipoteca(180000, 2.6, n), vinc = (300 + 250) / 12, gastos = 350;
    cerca(r.CUOTA1_1, c, 0.005);
    cerca(r.TAE_1, tae(180000 - gastos, Array(n).fill(c + vinc)), 0.006);
    cerca(r.COSTE_1, (c + vinc) * n + gastos - 180000, 0.5);
    const h = hipotecaFija(180000, 2.6, 30);
    cerca(r.CA_INT_1, h.cuadro.anios[0].interes, 0.01);
    cerca(r.CA_PEND_10, h.cuadro.anios[9].pendiente, 0.01);
    cerca(r.INTERESES_1, h.intereses, 0.5);
  });

  it('mixta y variable con el Euríbor un punto más alto', () => {
    const r = R['hip-mixta-y-variable-euribor-sube'];
    const m = hipotecaVariable(210000, 28, { tinFijo: 2.2, aniosFijos: 5, diferencial: 0.75, euriborAnio: () => 4 });
    cerca(r.CUOTA1_1, m.cuadro.meses[0].cuota, 0.005);
    cerca(r.CUOTA2_1, m.cuadro.meses[60].cuota, 0.005);
    cerca(r.INTERESES_1, m.intereses, 0.5);
    const v = hipotecaVariable(210000, 28, { diferencial: 0.9, euriborAnio: () => 4 });
    cerca(r.CUOTA1_2, v.cuadro.meses[0].cuota, 0.005);
    cerca(r.INTERESES_2, v.intereses, 0.5);
  });

  it('amortizar 30.000 € al cuarto año: reducir cuota o plazo y comisión legal', () => {
    const r = R['hip-amortizar-antes'];
    const h = hipotecaFija(220000, 3.1, 25);
    const pendiente = h.cuadro.meses[47].pendiente;
    cerca(r.AA_PENDIENTE, pendiente, 0.01);
    const a = amortizacionAnticipada({ pendiente, tin: 3.1, mesesRestantes: 300 - 48, importe: 30000, tipo: 'fijo', aniosDesdeFirma: 4 }, V27);
    cerca(r.AA_CUOTACUOTA, a.cuotaCuota, 0.01);
    cerca(r.AA_AHORROCUOTA, a.ahorroCuota, 0.5);
    expect(r.AA_MESESPLAZO).toBe(a.mesesPlazo);
    cerca(r.AA_AHORROPLAZO, a.ahorroPlazo, 1);
    expect(r.AA_TOPEPCT).toBe(topeComision(V27, 'fijo', 4));
    cerca(r.AA_COMISION, a.comision, 0.01);
  });
});

/* ------------------------------------------------------------------ Planificador de taxes 2026 (EE. UU.) */

const PUS = params('us', 2026);
const paisUS = JSON.parse(readFileSync('params/us/pais.json', 'utf8'));
const EC_ES: Record<EstadoCivil, string> = { single: 'Soltero (single)', mfj: 'Casado, declaración conjunta (married filing jointly)', hoh: 'Cabeza de familia (head of household)', mfs: 'Casado, declaración separada (married filing separately)' };
interface CasoUS { id: string; ec: EstadoCivil; estado: string; sal: number; retFed: number; retEst: number; ing: number; gas: number; otros: number; hijos: number; otrosDep: number; prevTax: number; prevAgi: number }
const US: CasoUS[] = [
  { id: 'us-single-california', ec: 'single', estado: 'CA', sal: 45000, retFed: 4000, retEst: 1200, ing: 30000, gas: 6000, otros: 0, hijos: 0, otrosDep: 0, prevTax: 7000, prevAgi: 60000 },
  { id: 'us-conjunta-nueva-york-hijos', ec: 'mfj', estado: 'NY', sal: 90000, retFed: 6000, retEst: 3000, ing: 60000, gas: 10000, otros: 1200, hijos: 2, otrosDep: 1, prevTax: 18000, prevAgi: 160000 },
  { id: 'us-cabeza-familia-nueva-jersey-solo-1099', ec: 'hoh', estado: 'NJ', sal: 0, retFed: 0, retEst: 0, ing: 120000, gas: 15000, otros: 0, hijos: 1, otrosDep: 0, prevTax: 0, prevAgi: 0 },
];

describe.skipIf(!hayLibreOffice)('Planificador de taxes 2026: el Excel reproduce los motores', () => {
  let R: Record<string, Record<string, any>> = {};
  beforeAll(() => {
    R = recalcular(US.map((c) => ({
      id: c.id, xlsx: xlsx('planificador-taxes-2026'),
      poner: { EC_TXT: EC_ES[c.ec], ESTADO_NOM: paisUS.estados[c.estado].nombre, SAL: c.sal, RET_FED: c.retFed, RET_EST: c.retEst, ING1099: c.ing, GAS1099: c.gas, OTROS: c.otros, HIJOS: c.hijos, OTROSDEP: c.otrosDep, PREV_TAX: c.prevTax, PREV_AGI: c.prevAgi },
      leer: ['FED_SE', 'FED_AGI', 'FED_QBI', 'FED_IMPONIBLE', 'FED_ESCALA', 'FED_CTCNO', 'FED_CTCRE', 'FED_TOTAL', 'FED_RESULTADO', 'EST_IMPUESTO_R', 'PE_FALTA_R', 'PE_MINIMO_R', 'VENCE_2026_1', 'VENCE_2026_4', 'VENCE_2027_4'],
    })));
  }, 600000);

  for (const c of US) {
    it(`${c.id}: federal (1040 y Schedule SE), estatal y pagos estimados`, () => {
      const r = R[c.id];
      const gan = Math.max(0, c.ing - c.gas);
      const f = impuestoFederal({ ec: c.ec, salarios: c.sal, gananciaAutonomo: gan, otrosIngresos: c.otros, hijos: c.hijos, otrosDependientes: c.otrosDep, retenido: c.retFed, anio: 2026 }, PUS);
      cerca(r.FED_SE, f.se.total, 0.01);
      cerca(r.FED_AGI, f.agi, 0.01);
      cerca(r.FED_QBI, f.qbi, 0.01);
      cerca(r.FED_IMPONIBLE, f.imponible, 0.01);
      cerca(r.FED_ESCALA, f.impuestoEscala, 0.01);
      cerca(r.FED_CTCNO, f.ctc.noReembolsable, 0.01);
      cerca(r.FED_CTCRE, f.ctc.reembolsable, 0.01);
      cerca(r.FED_TOTAL, f.impuestoTotal, 0.01);
      cerca(r.FED_RESULTADO, f.resultado, 0.01);
      const e = impuestoEstatal({ estado: c.estado, ec: c.ec, agi: f.agi, salarioBruto: c.sal + gan, imponibleFederal: f.imponible, dependientes: c.hijos + c.otrosDep }, PUS.fiscal);
      cerca(r.EST_IMPUESTO_R, e.impuesto, 0.01);
      cerca(r.PE_FALTA_R, Math.max(0, f.impuestoTotal - f.pagos), 0.01);
      const ps = PUS.fiscal.pagos_estimados.puerto_seguro;
      const anterior = c.prevTax * (c.prevAgi > (c.ec === 'mfs' ? ps.agi_alto_mfs : ps.agi_alto) ? ps.pct_anio_anterior_agi_alto : ps.pct_anio_anterior) / 100;
      const requerido = c.prevTax > 0 ? Math.min(f.impuestoTotal * ps.pct_anio_actual / 100, anterior) : f.impuestoTotal * ps.pct_anio_actual / 100;
      cerca(r.PE_MINIMO_R, Math.max(0, requerido - f.pagos), 0.01);
      // Vencimientos del Form 1040-ES (Pub. 509): 15/4/2026, 15/1/2027 y, para 2027, 18/1/2028 (15 sábado y 17 MLK Day)
      expect([r.VENCE_2026_1, r.VENCE_2026_4, r.VENCE_2027_4]).toEqual(['2026-04-15', '2027-01-15', '2028-01-18']);
    });
  }
});
