// Calendario laboral 2027: integridad de los datos (params/es/<año>/calendario.json), motor de días laborables y
// hábiles, calculadora «dias-laborables» y coherencia del CSV de páginas con los datos.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import cal27 from '../params/es/2027/calendario.json';
import cal26 from '../params/es/2026/calendario.json';
import { contarLaborables, sumarHabiles, resumenAnio, descansos, festivosLugar, diaSemana } from '../src/lib/calc/calendario';
import { leerCSV } from './util-programaticas';
import { PLANTILLAS } from '../src/plantillas/index';
import { params } from '../src/lib/params';
import calc from '../src/calculadoras/dias-laborables';

const C27: Record<string, any> = cal27.comunidades;
const ORIGENES = ['nacional', 'sustituible', 'autonomico', 'local'];
const NACIONALES = ['2027-01-01', '2027-03-26', '2027-05-01', '2027-10-12', '2027-11-01', '2027-12-06', '2027-12-08', '2027-12-25'];

describe('datos del calendario', () => {
  it('17 comunidades con página y Ceuta y Melilla sin ella', () => {
    const conPagina = Object.entries(C27).filter(([, c]) => c.paginas !== false).map(([k]) => k);
    expect(conPagina).toHaveLength(17);
    expect(conPagina).toEqual(expect.arrayContaining(['PV', 'NA']));
    expect(C27.CE.paginas).toBe(false);
  });
  for (const [cc, c] of Object.entries(C27)) {
    it(`${cc}: 12 festivos de 2027 válidos, con fuente y «verificado»`, () => {
      if (c.completo !== false) expect(c.festivos).toHaveLength(12);
      expect(typeof c.verificado).toBe('boolean');
      expect(c.fuente.url).toMatch(/^https:\/\//);
      const fechas = c.festivos.map((f: any) => f.f);
      expect(new Set(fechas).size).toBe(fechas.length);
      for (const f of c.festivos) {
        expect(f.f).toMatch(/^2027-\d\d-\d\d$/);
        expect(Number.isNaN(Date.parse(f.f))).toBe(false);
        expect(ORIGENES).toContain(f.o);
        expect(f.n.es && f.n.ca).toBeTruthy();
      }
      // Las 8 fiestas nacionales no sustituibles que no caen en domingo están en todas las comunidades
      for (const n of NACIONALES) expect(fechas, `${cc} sin ${n}`).toContain(n);
    });
  }
  it('las fechas de Semana Santa de 2027 son las del calendario litúrgico (Pascua el 28 de marzo)', () => {
    expect(diaSemana('2027-03-25')).toBe(3); // jueves
    expect(diaSemana('2027-03-29')).toBe(0); // lunes
    expect(C27.CT.festivos.map((f: any) => f.f)).not.toContain('2027-03-25'); // Cataluña no tiene Jueves Santo
    expect(C27.VC.festivos.map((f: any) => f.f)).not.toContain('2027-03-25');
  });
  it('municipios: unos 150, sin repetir, y los publicados con sus 2 festivos locales y fuente', () => {
    const m = cal27.municipios as any[];
    expect(m.length).toBeGreaterThanOrEqual(140);
    expect(new Set(m.map((x) => x.id)).size).toBe(m.length);
    for (const x of m) {
      expect(C27[x.ccaa], x.id).toBeTruthy();
      expect(['publicado', 'pendiente']).toContain(x.estado);
      expect(typeof x.verificado).toBe('boolean');
      if (x.estado === 'publicado') {
        expect(x.festivos, x.id).toHaveLength(2);
        expect(x.fuente.url).toMatch(/^https:\/\//);
        for (const f of x.festivos) { expect(f.o).toBe('local'); expect(f.f).toMatch(/^2027-/); }
      } else {
        expect(x.festivos).toHaveLength(0);
        expect(x.nota, x.id).toBeTruthy();
      }
    }
  });
  it('2026: 12 festivos por comunidad salvo las marcadas como incompletas', () => {
    for (const [cc, c] of Object.entries(cal26.comunidades as Record<string, any>)) {
      if (c.completo !== false) expect(c.festivos, cc).toHaveLength(12);
      for (const f of c.festivos) expect(f.f).toMatch(/^2026-/);
    }
  });
  it('el CSV de páginas son las 17 comunidades y exactamente los municipios publicados', () => {
    const filas = leerCSV('nomina', 'calendario-laboral.csv');
    const pub = (cal27.municipios as any[]).filter((m) => m.estado === 'publicado').map((m) => m.id).sort();
    expect(filas.filter((f) => f.tipo === 'comunidad')).toHaveLength(17);
    expect(filas.filter((f) => f.tipo === 'municipio').map((f) => f.id).sort()).toEqual(pub);
  });
});

describe('motor: días laborables', () => {
  it('2027 tiene 261 días de lunes a viernes', () => {
    const c = contarLaborables('c-XX', '2027-01-01', '2027-12-31');
    expect(c.naturales).toBe(365);
    expect(c.laborables + c.festivos.length).toBe(261);
  });
  it('Comunidad de Madrid: 251 laborables (10 festivos entre semana, 2 en sábado)', () => {
    const r = resumenAnio('c-MD', 2027);
    expect(r).toMatchObject({ laborables: 251, festivosSemana: 10, festivosFinde: 2, total: 12 });
  });
  it('Cataluña: 252 laborables (1 de mayo, 11 de septiembre y 25 de diciembre en sábado)', () => {
    expect(resumenAnio('c-CT', 2027)).toMatchObject({ laborables: 252, festivosFinde: 3 });
  });
  it('ciudad de Madrid: la Almudena resta un día y San Isidro (sábado) no', () => {
    expect(resumenAnio('m-madrid', 2027)).toMatchObject({ laborables: 250, total: 14, festivosFinde: 3 });
  });
  it('Barcelona: 250 laborables con el Lunes de Pascua Granada y la Mercè', () => {
    expect(resumenAnio('m-barcelona', 2027).laborables).toBe(250);
  });
  it('un festivo local que coincide con uno autonómico no se cuenta dos veces', () => {
    const fs = festivosLugar('m-palma', 2027).festivos.map((f) => f.f);
    expect(new Set(fs).size).toBe(fs.length);
  });
  it('marzo de 2027 en Andalucía: 23 días entre semana menos 1 de marzo, Jueves y Viernes Santo', () => {
    expect(contarLaborables('c-AN', '2027-03-01', '2027-03-31').laborables).toBe(20);
  });
  it('avisa de los años sin datos', () => {
    expect(contarLaborables('c-AN', '2028-01-01', '2028-01-31').sinDatos).toEqual([2028]);
    expect(contarLaborables('m-malaga', '2026-12-01', '2027-01-31').sinLocales).toBe(true);
  });
});

describe('motor: plazos en días hábiles (Ley 39/2015, art. 30)', () => {
  it('10 días hábiles desde el lunes 22 de marzo de 2027 en Málaga acaban el miércoles 7 de abril', () => {
    const p = sumarHabiles('m-malaga', '2027-03-22', 10);
    expect(p.fin).toBe('2027-04-07');
    expect(p.saltados.filter((s) => s.motivo !== 'finde')).toHaveLength(2);
  });
  it('en Barcelona se salta el Lunes de Pascua pero no el Jueves Santo y también acaba el 7 de abril', () => {
    const p = sumarHabiles('m-barcelona', '2027-03-22', 10);
    expect(p.fin).toBe('2027-04-07');
    expect(p.saltados.map((s) => s.f)).toContain('2027-03-29');
    expect(p.saltados.map((s) => s.f)).not.toContain('2027-03-25');
  });
  it('una notificación en viernes empieza a contar el lunes siguiente', () => {
    expect(sumarHabiles('c-MD', '2027-01-15', 1).fin).toBe('2027-01-18');
  });
  it('el plazo salta el puente de diciembre (6 y 8 festivos)', () => {
    expect(sumarHabiles('c-MD', '2027-12-03', 3).fin).toBe('2027-12-10');
  });
});

describe('motor: puentes', () => {
  it('Madrid 2027: puentes el lunes 11 de octubre (4 días) y el martes 7 de diciembre (5 días)', () => {
    const { puentes } = descansos('c-MD', 2027);
    expect(puentes.map((p) => [p.dia, p.dias])).toEqual([['2027-10-11', 4], ['2027-12-07', 5]]);
  });
  it('Extremadura no tiene puente el 11 de octubre: es festivo', () => {
    expect(descansos('c-EX', 2027).puentes.map((p) => p.dia)).not.toContain('2027-10-11');
  });
});

describe('calculadora dias-laborables', () => {
  const P = params('es', 2027);
  it('por defecto: Comunidad de Madrid en 2027 → 251', () => {
    const r = calc.calcular({ modo: 'laborables', lugar: 'c-MD', desde: '2027-01-01', hasta: '2027-12-31', dias: 10 }, { P, lang: 'es', pais: 'es' });
    expect(r.destacado.v).toBe(251);
    expect(r.tablas![0].filas).toHaveLength(12);
  });
  it('las fechas al revés se ordenan', () => {
    const r = calc.calcular({ modo: 'laborables', lugar: 'c-AN', desde: '2027-03-31', hasta: '2027-03-01', dias: 10 }, { P, lang: 'ca', pais: 'es' });
    expect(r.destacado.v).toBe(20);
  });
  it('modo plazo: último día y aviso de la Ley 39/2015', () => {
    const r = calc.calcular({ modo: 'habiles', lugar: 'm-malaga', desde: '2027-03-22', hasta: '2027-12-31', dias: 10 }, { P, lang: 'es', pais: 'es' });
    expect(r.destacado.v).toBe('2027-04-07');
    expect(JSON.stringify(r.avisos)).toMatch(/39\/2015/);
  });
  it('ofrece las 17 comunidades y los municipios publicados', () => {
    const op = (calc.campos.find((c) => c.id === 'lugar') as any).opciones;
    expect(op.filter((o: any) => o.v.startsWith('c-'))).toHaveLength(17);
    expect(op.filter((o: any) => o.v.startsWith('m-')).length).toBe((cal27.municipios as any[]).filter((m) => m.estado === 'publicado').length);
  });
});

describe('páginas del calendario', () => {
  const cfg = JSON.parse(readFileSync('sitios/nomina/sitio.json', 'utf8'));
  const col = cfg.programaticas.find((c: any) => c.id === 'calendario-laboral');
  const filas = leerCSV('nomina', col.csv);
  const P = params('es', 2027);
  for (const lang of ['es', 'ca'] as const) {
    it(`(${lang}) cada página lleva el calendario de 12 meses, la tabla de festivos y la comparación con 2026`, () => {
      for (const f of filas) {
        const pg = PLANTILLAS[col.plantilla](f, { P, lang, anio: 2027, filas });
        expect((pg.bloque!.match(/<table class="cal-mes">/g) ?? []).length, f.id).toBe(12);
        expect(pg.bloque).toMatch(/class="cal-ley"/);
        expect(pg.tablas[0].filas.length).toBe(f.tipo === 'municipio' ? 14 : 12);
        // La comparación con 2026 solo se publica donde la lista de 2026 está completa (no en Baleares ni Canarias)
        const sin2026 = ['IB', 'CN'].includes(f.id) || f.id === 'palma';
        expect(JSON.stringify(pg.tablas).includes('2026'), f.id).toBe(!sin2026);
        expect(pg.cifra!.v).toBeGreaterThan(240);
      }
    });
  }
  it('las páginas en catalán tienen textos en catalán', () => {
    const f = filas.find((x) => x.id === 'barcelona')!;
    const pg = PLANTILLAS[col.plantilla](f, { P, lang: 'ca', anio: 2027, filas });
    expect(pg.h1).toBe('Calendari laboral 2027 de Barcelona');
    expect(pg.intro).toMatch(/dies laborables el 2027/);
    expect(pg.bloque).toMatch(/Gener/);
  });
});
