// Genera, para los 2 cuentos de muestra: imágenes web (public/muestras/<slug>/), PDF de lectura,
// interior de imprenta y cubierta (datos-locales/muestras/, fuera de git).
// Originales de Higgsfield en datos-locales/originales/<carpeta>/00..12.(png|jpeg)
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { generarCubierta, generarInterior } from "../src/lib/maquetacion";
import { MUESTRAS } from "../src/lib/muestras";

const CARPETA: Record<string, string> = { "leo-y-la-luz-de-la-luna": "leo", "la-martina-i-els-secrets-de-lleida": "martina" };

for (const m of MUESTRAS) {
  const dir = path.join("datos-locales/originales", CARPETA[m.slug]);
  const ficheros = (await readdir(dir)).filter((f) => /^\d\d\./.test(f)).sort();
  if (ficheros.length !== 13) { console.log(`${m.slug}: faltan imágenes (${ficheros.length}/13)`); continue; }
  const imagenes = await Promise.all(ficheros.map((f) => readFile(path.join(dir, f))));
  const cuento = JSON.parse(await readFile(`content/muestras/${m.slug}.json`, "utf8"));
  const web = path.join("public/muestras", m.slug);
  await mkdir(web, { recursive: true });
  await Promise.all(imagenes.map(async (img, i) => {
    const n = String(i).padStart(2, "0");
    await sharp(img).resize(1200, 1200).webp({ quality: 78 }).toFile(path.join(web, `${n}.webp`));
    await sharp(img).resize(480, 480).webp({ quality: 72 }).toFile(path.join(web, `${n}-p.webp`));
  }));
  const out = path.join("datos-locales/muestras");
  await mkdir(out, { recursive: true });
  const base = { cuento, idioma: m.datos.idioma, nombre: m.datos.nombre, imagenes };
  const t0 = Date.now();
  await writeFile(path.join(out, `${m.slug}.pdf`), await generarInterior({ ...base, modo: "pantalla" }));
  await writeFile(path.join(out, `${m.slug}-interior-imprenta.pdf`), await generarInterior({ ...base, modo: "imprenta" }));
  await writeFile(path.join(out, `${m.slug}-cubierta-imprenta.pdf`), await generarCubierta(base));
  console.log(`${m.slug}: listo en ${Date.now() - t0} ms`);
}
