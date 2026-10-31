import { describe, it, expect } from 'vitest';
import { params, anios } from '../src/lib/params';
import { valoresPorDefecto } from '../src/lib/def';
import { renderResultado } from '../src/lib/render';
import nomina from '../sitios/nomina/sitio.json';
import impuestos from '../sitios/impuestos/sitio.json';
import eeuu from '../sitios/eeuu/sitio.json';
import vivienda from '../sitios/vivienda/sitio.json';

const defs = import.meta.glob('../src/calculadoras/*.ts', { eager: true, import: 'default' }) as Record<string, any>;
const ids = [...nomina.calculadoras, ...impuestos.calculadoras];

describe('todas las calculadoras', () => {
  it('hay 41 y todas tienen definición', () => {
    expect(ids.length).toBe(41);
    for (const id of ids) expect(defs[`../src/calculadoras/${id}.ts`], id).toBeTruthy();
  });
  for (const id of ids) {
    for (const anio of anios('es')) {
      for (const lang of ['es', 'ca'] as const) {
        it(`${id} ${anio} ${lang}`, () => {
          const d = defs[`../src/calculadoras/${id}.ts`];
          const r = d.calcular(valoresPorDefecto(d, anio), { P: params('es', anio), lang, pais: 'es' });
          const html = renderResultado(r, lang);
          expect(html).not.toMatch(/NaN|undefined|Infinity|\[object Object\]/);
          expect(html.length).toBeGreaterThan(50);
        });
      }
    }
  }
});

// Sitio de EE. UU. (un solo idioma, USD y es-US)
describe('calculadoras de EE. UU.', () => {
  it('hay al menos 15 y todas tienen definición', () => {
    expect(eeuu.calculadoras.length).toBeGreaterThanOrEqual(15);
    for (const id of eeuu.calculadoras) expect(defs[`../src/calculadoras/${id}.ts`], id).toBeTruthy();
  });
  for (const id of eeuu.calculadoras) {
    for (const anio of anios('us')) {
      it(`${id} ${anio}`, () => {
        const d = defs[`../src/calculadoras/${id}.ts`];
        const r = d.calcular(valoresPorDefecto(d, anio), { P: params('us', anio), lang: 'es', pais: 'us' });
        const html = renderResultado(r, 'es', 'USD', 'es-US');
        expect(html).not.toMatch(/NaN|undefined|Infinity|\[object Object\]|€/);
        expect(html).toMatch(/\$/);
      });
    }
  }
});

// PisoClaro (vivienda): las 20 calculadoras con sus valores por defecto, en los dos idiomas y los dos años
describe('calculadoras de vivienda', () => {
  it('hay 20 y todas tienen definición', () => {
    expect(vivienda.calculadoras.length).toBe(20);
    for (const id of vivienda.calculadoras) expect(defs[`../src/calculadoras/${id}.ts`], id).toBeTruthy();
  });
  for (const id of vivienda.calculadoras) {
    for (const anio of anios('es')) {
      for (const lang of ['es', 'ca'] as const) {
        it(`${id} ${anio} ${lang}`, () => {
          const d = defs[`../src/calculadoras/${id}.ts`];
          const r = d.calcular(valoresPorDefecto(d, anio), { P: params('es', anio), lang, pais: 'es' });
          const html = renderResultado(r, lang);
          expect(html).not.toMatch(/NaN|undefined|Infinity|\[object Object\]/);
          expect(html.length).toBeGreaterThan(50);
        });
      }
    }
  }
  // Casos límite: comunidades sin dato y importes a cero no rompen ninguna calculadora
  for (const id of vivienda.calculadoras) {
    it(`${id} con comunidades especiales e importes a 0`, () => {
      const d = defs[`../src/calculadoras/${id}.ts`];
      for (const ccaa of ['MC', 'CN', 'PV', 'CT']) for (const nueva of ['usada', 'nueva']) {
        const v: Record<string, any> = { ...valoresPorDefecto(d, 2026), ccaa, nueva };
        const r = d.calcular(v, { P: params('es', 2026), lang: 'es', pais: 'es' });
        expect(renderResultado(r, 'es')).not.toMatch(/NaN|undefined|\[object Object\]/);
      }
      const cero: Record<string, any> = { ...valoresPorDefecto(d, 2026) };
      for (const c of d.campos) if (c.tipo === 'numero') cero[c.id] = 0;
      expect(() => renderResultado(d.calcular(cero, { P: params('es', 2026), lang: 'ca', pais: 'es' }), 'ca')).not.toThrow();
    });
  }
});
