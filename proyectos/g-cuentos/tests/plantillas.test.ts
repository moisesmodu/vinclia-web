import assert from "node:assert/strict";
import { test } from "node:test";
import { cuentoDePlantilla } from "../src/lib/cuento";
import { encargoIlustracion } from "../src/lib/ilustraciones";
import { PLANTILLAS, idPlantilla } from "../src/lib/plantillas";
import { revisar } from "../src/lib/plantillas/revision";
import { articuloCa, quedanMarcadores, type DatosNino } from "../src/lib/rellenar";

for (const [id, p] of Object.entries(PLANTILLAS))
  test(`plantilla ${id}: páginas, escenas y todas las combinaciones limpias`, () => {
    assert.deepEqual(revisar(p, id), []);
  });

test("la edad elige la plantilla: 2–4 → 18 páginas, 5–8 → 22", () => {
  assert.equal(idPlantilla("dormir", 3), "dormir-peques");
  assert.equal(idPlantilla("dormir", 5), "dormir-mayores");
  const d: DatosNino = { nombre: "Leo", edad: 4, genero: "m", ciudad: "Zaragoza", companero: "gato", mascota: "Bigotes", aficion: "dinosaurios", coleccion: "dormir", tema: "oscuridad", idioma: "es" };
  assert.equal(cuentoDePlantilla(d).paginas.length, 18);
  assert.equal(cuentoDePlantilla({ ...d, edad: 7 }).paginas.length, 22);
  for (const s of cuentoDePlantilla({ ...d, edad: 7, idioma: "ca" }).paginas) assert.ok(!quedanMarcadores(s));
});

test("encargo: hoja propia solo si la familia cambia el aspecto o el color", () => {
  const d: DatosNino = { nombre: "Leo", edad: 4, genero: "m", ciudad: "Zaragoza", companero: "gato", mascota: "Bigotes", aficion: "dinosaurios", coleccion: "dormir", tema: "oscuridad", idioma: "es" };
  const serie = encargoIlustracion(d);
  assert.equal(serie.hoja, undefined);
  assert.equal(serie.prompts.length, 19);
  assert.equal(serie.prompts[1].proporcion, "3:2");
  const propio = encargoIlustracion({ ...d, edad: 6, color: "verde", aspecto: { piel: "clara", pelo: "pelirrojo", peinado: "largo", gafas: true, pecas: false } });
  assert.ok(propio.hoja?.prompt.includes("copper-red"));
  assert.ok(propio.hoja?.prompt.includes("glasses"));
  assert.equal(propio.referencias[0], "HOJA_DEL_PEDIDO");
  assert.equal(propio.prompts.length, 23);
  assert.ok(propio.prompts.every((x) => !/\{[A-Z.]+\}/.test(x.prompt)));
  assert.ok(propio.prompts[3].prompt.includes("green") || propio.prompts.some((x) => x.prompt.includes("green")));
});

test("artículo personal catalán", () => {
  assert.equal(articuloCa("Pau", "m"), "en Pau");
  assert.equal(articuloCa("Martina", "f"), "la Martina");
  assert.equal(articuloCa("Oriol", "m"), "l'Oriol");
  assert.equal(articuloCa("Anna", "f"), "l'Anna");
});
