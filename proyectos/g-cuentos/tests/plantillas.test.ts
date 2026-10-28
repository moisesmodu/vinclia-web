import assert from "node:assert/strict";
import { test } from "node:test";
import { AFICIONES, COLECCIONES, COMPANEROS } from "../src/lib/catalogo";
import { cuentoDePlantilla } from "../src/lib/cuento";
import { PLANTILLAS } from "../src/lib/plantillas";
import { articuloCa, quedanMarcadores, type DatosNino } from "../src/lib/rellenar";

test("cada plantilla tiene 12 páginas y escenas para todos sus temas", () => {
  for (const c of COLECCIONES) {
    const p = PLANTILLAS[c.id];
    assert.equal(p.paginas.length, 12, c.id);
    const usaTema = p.paginas.some((pg) => pg.escena.includes("{TEMA."));
    if (usaTema) for (const t of c.temas) assert.ok(p.escenasTema?.[t.id], `${c.id}/${t.id} sin escenas`);
  }
});

test("todas las combinaciones se rellenan sin marcadores sueltos", () => {
  let n = 0;
  for (const c of COLECCIONES)
    for (const t of c.temas)
      for (const idioma of ["es", "ca"] as const)
        for (const genero of ["m", "f"] as const)
          for (const comp of COMPANEROS)
            for (const af of AFICIONES)
              for (const ciudad of ["Lleida", "Alcarràs", "Zaragoza"]) {
                const d: DatosNino = {
                  nombre: genero === "m" ? "Oriol" : "Martina", edad: 5, genero, ciudad,
                  companero: comp.id, mascota: "Nube", aficion: af.id, coleccion: c.id, tema: t.id, idioma,
                  bebe: n % 2 ? "Nora" : undefined, bebeGenero: "f",
                };
                const cu = cuentoDePlantilla(d);
                for (const s of [cu.titulo, ...cu.paginas]) {
                  assert.ok(!quedanMarcadores(s), `${c.id}/${t.id}/${idioma}: ${s}`);
                  assert.ok(!/\b(de|a) el\b/.test(s), `contracción: ${s}`);
                }
                n++;
              }
  assert.ok(n > 1000);
});

test("artículo personal catalán", () => {
  assert.equal(articuloCa("Pau", "m"), "en Pau");
  assert.equal(articuloCa("Martina", "f"), "la Martina");
  assert.equal(articuloCa("Oriol", "m"), "l'Oriol");
  assert.equal(articuloCa("Anna", "f"), "l'Anna");
});
