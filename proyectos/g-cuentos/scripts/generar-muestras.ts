// Genera, para los 2 cuentos de muestra: imágenes web (public/muestras/<slug>/, numeradas como la
// plantilla: 00 portada cuadrada, 01..N páginas 3:2), PDF de lectura, interior de imprenta y cubierta
// (datos-locales/muestras/, fuera de git) cuando están todas las ilustraciones.
// Originales de Higgsfield en datos-locales/originales/<carpeta>/:
//   00..12.(png|jpeg) = ilustraciones del cuento antiguo de 12 páginas (las reutiliza `base`)
//   nNN.(png|jpeg)    = ilustraciones nuevas de la página NN de la plantilla de 18/22 páginas
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { generarCubierta, generarInterior } from "../src/lib/maquetacion";
import { MUESTRAS } from "../src/lib/muestras";

const CARPETA: Record<string, string> = { "leo-y-la-luz-de-la-luna": "leo", "la-martina-i-els-secrets-de-lleida": "martina" };

for (const m of MUESTRAS) {
  const dir = path.join("datos-locales/originales", CARPETA[m.slug]);
  const ficheros = await readdir(dir);
  const buscar = (base: string) => ficheros.find((f) => f.replace(/\.(png|jpe?g|webp)$/, "") === base);
  const jsonPath = `content/muestras/${m.slug}.json`;
  const cuento = JSON.parse(await readFile(jsonPath, "utf8"));
  const bases: (number | null)[] = cuento.base ?? cuento.paginas.map((_: string, i: number) => i + 1);
  const origen: (string | undefined)[] = [buscar("00"), ...cuento.paginas.map((_: string, i: number) => {
    const n = String(i + 1).padStart(2, "0");
    return buscar(`n${n}`) ?? (bases[i] ? buscar(String(bases[i]).padStart(2, "0")) : undefined);
  })];
  const web = path.join("public/muestras", m.slug);
  if (existsSync(web)) await rm(web, { recursive: true });
  await mkdir(web, { recursive: true });
  await Promise.all(origen.map(async (f, i) => {
    if (!f) return;
    const n = String(i).padStart(2, "0");
    const img = await readFile(path.join(dir, f));
    const [w, h] = i === 0 ? [1200, 1200] : [1200, 800];
    await sharp(img).resize(w, h, { fit: "cover" }).webp({ quality: 78 }).toFile(path.join(web, `${n}.webp`));
    await sharp(img).resize(w * 0.4, h * 0.4, { fit: "cover" }).webp({ quality: 72 }).toFile(path.join(web, `${n}-p.webp`));
  }));
  cuento.ilustradas = origen.slice(1).map(Boolean);
  await writeFile(jsonPath, JSON.stringify(cuento, null, 2) + "\n");
  const faltan = origen.filter((f) => !f).length;
  if (faltan) { console.log(`${m.slug}: imágenes web listas; faltan ${faltan} ilustraciones para el PDF`); continue; }
  const imagenes = await Promise.all(origen.map((f) => readFile(path.join(dir, f!))));
  const out = path.join("datos-locales/muestras");
  await mkdir(out, { recursive: true });
  const base = { cuento, datos: m.datos, idioma: m.datos.idioma, nombre: m.datos.nombre, imagenes };
  const t0 = Date.now();
  await writeFile(path.join(out, `${m.slug}.pdf`), await generarInterior({ ...base, modo: "pantalla" }));
  await writeFile(path.join(out, `${m.slug}-interior-imprenta.pdf`), await generarInterior({ ...base, modo: "imprenta" }));
  await writeFile(path.join(out, `${m.slug}-cubierta-imprenta.pdf`), await generarCubierta(base));
  console.log(`${m.slug}: listo en ${Date.now() - t0} ms`);
}
