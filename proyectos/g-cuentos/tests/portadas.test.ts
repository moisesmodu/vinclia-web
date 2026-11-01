import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { COLECCIONES } from "../src/lib/catalogo";
import { carpetaBiblioteca } from "../src/lib/ilustraciones";
import { carpetaPortada } from "../src/lib/portadas";

// El creador enseña la portada de biblioteca en vivo: las 16 combinaciones deben existir (portada y páginas 1–3)
// y coincidir con la carpeta que usa la vista previa en el servidor.
for (const c of COLECCIONES) for (const edad of [3, 6]) for (const g of ["m", "f"] as const)
  test(`portada de biblioteca ${c.id} · ${edad} años · ${g}`, () => {
    const dir = carpetaPortada(c.id, edad, g);
    for (const n of ["00", "01", "02", "03"]) assert.ok(existsSync(path.join("public", dir, `${n}.webp`)), `${dir}/${n}.webp`);
    assert.equal(carpetaBiblioteca(c.id, edad, g), dir);
  });

test("imágenes de marca de la web", () => {
  for (const f of ["hero-ancho", "hero-movil", "libro-tapa-dura", "libro-pdf", "col-dormir", "col-valores", "col-hermanito", "col-ciudad", "navidad"])
    assert.ok(existsSync(path.join("public/marca", `${f}.webp`)), f);
});
