// Calidad de las páginas por combinación: cada fila de cada colección tiene que producir una página con datos
// propios (intro, título y cifra que no se repiten), 2 o 3 preguntas frecuentes con respuesta numérica,
// gráfico, tabla y enlaces que apuntan a filas que existen. Es la defensa contra el contenido programático flojo.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { params } from '../src/lib/params';
import { leerCSV, rellenar } from './util-programaticas';
import { PLANTILLAS } from '../src/plantillas/index';

const SITIOS = ['nomina', 'impuestos', 'eeuu', 'vivienda'];
// Colecciones que estrenan esta tanda (las anteriores no tenían preguntas frecuentes)
const NUEVAS = ['neto-bruto-comunidad', 'indemnizacion-anos', 'paro-base', 'paro-anos', 'autonomos-tramo', 'modelo-303-trimestre', 'modelo-130-trimestre', 'iva-producto', 'impuesto-estatal-estado', 'overtime-estado', 'credito-hijos', 'cheque-estado-salario', 'hora-a-anual', 'cuota-por-importe', 'gastos-por-comunidad', 'itp-por-comunidad'];

for (const sitio of SITIOS) {
  const cfg = JSON.parse(readFileSync(`sitios/${sitio}/sitio.json`, 'utf8'));
  const P = params(cfg.pais, cfg.anioPorDefecto);
  describe(sitio, () => {
    for (const col of cfg.programaticas) {
      const filas = leerCSV(sitio, col.csv);
      for (const lang of cfg.idiomas) {
        it(`${col.id} (${lang}): ${filas.length} páginas con datos propios`, () => {
          expect(col.indice?.[lang], 'falta la ruta de la página índice').toBeTruthy();
          const vistos = { titulo: new Set<string>(), h1: new Set<string>(), intro: new Set<string>(), slug: new Set<string>() };
          for (const fila of filas) {
            const slug = rellenar(col.slug[lang], fila);
            expect(slug, `hueco sin rellenar en ${col.slug[lang]}`).not.toMatch(/--|-$|\{/);
            const pg = PLANTILLAS[col.plantilla](fila, { P, lang, anio: cfg.anioPorDefecto, filas });
            const txt = JSON.stringify(pg);
            expect(txt, slug).not.toMatch(/NaN|undefined|Infinity|\[object Object\]/);
            for (const k of ['titulo', 'h1', 'intro'] as const) {
              expect(vistos[k].has(pg[k]), `${k} repetido en ${slug}`).toBe(false);
              vistos[k].add(pg[k]);
            }
            expect(vistos.slug.has(slug), `slug repetido ${slug}`).toBe(false);
            vistos.slug.add(slug);
            expect(cfg.calculadoras).toContain(pg.calc);
            expect(Object.keys(pg.query).length).toBeGreaterThan(0);
            expect(pg.tablas.length).toBeGreaterThan(0);
            // La intro lleva cifras de la propia página, no solo texto
            const cifras = new Set(pg.intro.replace(/<[^>]+>/g, '').match(/\d[\d.,]*/g) ?? []);
            expect(cifras.size, `intro con pocas cifras en ${slug}`).toBeGreaterThanOrEqual(4);
            for (const e of pg.enlaces ?? []) {
              const destino = e.col ? cfg.programaticas.find((c: any) => c.id === e.col) : col;
              expect(destino, `colección ${e.col} inexistente`).toBeTruthy();
              expect(rellenar(destino.slug[lang], e.fila), `enlace con hueco desde ${slug}`).not.toMatch(/--|-$|\{/);
            }
            if (NUEVAS.includes(col.id)) {
              expect(pg.cifra, `sin cifra en ${slug}`).toBeTruthy();
              expect(pg.grafico, `sin gráfico en ${slug}`).toBeTruthy();
              expect(pg.faq?.length ?? 0, `preguntas en ${slug}`).toBeGreaterThanOrEqual(2);
              expect(pg.faq!.length).toBeLessThanOrEqual(3);
              for (const q of pg.faq!) expect(q.r, `respuesta sin cifra en ${slug}: ${q.p}`).toMatch(/\d/);
              expect(pg.titulo.length, `título largo en ${slug}: ${pg.titulo}`).toBeLessThanOrEqual(70);
              expect(pg.descripcion.length, `descripción larga en ${slug}`).toBeLessThanOrEqual(175);
            }
          }
        });
      }
    }
  });
}

describe('casos concretos', () => {
  const P = params('es', 2027);
  const fila = { bruto: '30000', ccaa: 'MD', slug_es: 'madrid', slug_ca: 'madrid' };
  it('30.000 € en Madrid: Madrid paga menos IRPF que la media y dice cuánto', () => {
    const pg = PLANTILLAS['neto-bruto-comunidad'](fila, { P, lang: 'es', anio: 2027, filas: [fila] });
    expect(pg.intro).toMatch(/menos de IRPF al año que la media/);
    expect(pg.cifra!.extra![1].v).toBeLessThan(0);
  });
  it('modelo 303 del 4T de 2027: el 30 de enero de 2028 es domingo y el plazo pasa al lunes 31', () => {
    const f = { t: '4', slug_es: 'cuarto-trimestre', slug_ca: 'quart-trimestre' };
    const pg = PLANTILLAS['modelo-303-trimestre'](f, { P, lang: 'es', anio: 2027, filas: [f] });
    expect(pg.faq![0].r).toMatch(/lunes 31 de enero de 2028/);
  });
});
