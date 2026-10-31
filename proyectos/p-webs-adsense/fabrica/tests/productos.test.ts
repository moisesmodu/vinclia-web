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
  const leer = ['RES303_1', 'RES303_2', 'RES303_3', 'RES303_4', 'RES130_1', 'RES130_2', 'RES130_3', 'RES130_4', 'PAGO130_1', 'PAGO130_2', 'PAGO130_3', 'PAGO130_4', 'TRAMO', 'CUOTA_PREVISTA', 'CUOTA_ANUAL', 'RENTA_TOTAL', 'RENTA_RESULTADO'];
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
        expect(r[`RES303_${q}`], `303 ${q}T`).toBeCloseTo(m.resultado, 1);
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
        expect(r[`RES130_${q}`], `130 ${q}T`).toBeCloseTo(m.resultado, 1);
        expect(r[`PAGO130_${q}`]).toBeCloseTo(m.aIngresar, 1);
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
