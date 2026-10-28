import { describe, it, expect } from 'vitest';
import { params, anios } from '../src/lib/params';
import { valoresPorDefecto } from '../src/lib/def';
import { renderResultado } from '../src/lib/render';
import nomina from '../sitios/nomina/sitio.json';
import impuestos from '../sitios/impuestos/sitio.json';
import eeuu from '../sitios/eeuu/sitio.json';

const defs = import.meta.glob('../src/calculadoras/*.ts', { eager: true, import: 'default' }) as Record<string, any>;
const ids = [...nomina.calculadoras, ...impuestos.calculadoras];

describe('todas las calculadoras', () => {
  it('hay 40 y todas tienen definición', () => {
    expect(ids.length).toBe(40);
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
