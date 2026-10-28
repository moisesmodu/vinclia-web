// Revisión automática de una plantilla de 18/22 páginas (la usan los tests y scripts/revisar-plantilla.ts).
// Rellena todas las combinaciones (temas × idioma × género × compañero × afición × ciudad × detalles)
// y comprueba marcadores, longitudes, contracciones, presencia del nombre y la frase final.
import { AFICIONES, ARROPA, COLECCIONES, COLORES, COMPANEROS } from "../catalogo";
import { quedanMarcadores, rellenar, type DatosNino } from "../rellenar";
import { BANDAS, type Plantilla } from "./tipos";

export function revisar(p: Plantilla, id: string): string[] {
  const errores: string[] = [];
  const err = (s: string) => errores.length < 40 && errores.push(s);
  const [col, banda] = id.split("-");
  if (p.coleccion !== col || p.banda !== banda) err(`coleccion/banda no coinciden con ${id}`);
  const B = BANDAS[p.banda];
  if (p.paginas.length !== B.paginas) err(`${p.paginas.length} páginas; deben ser ${B.paginas}`);
  if (!p.portada.includes("{LUNILLA}") || !/upper right/i.test(p.portada)) err("la portada debe llevar {LUNILLA} en la esquina superior derecha (upper right)");
  const ultima = p.paginas[p.paginas.length - 1];
  if (!ultima?.escena.includes("{LUNILLA}")) err("la última escena debe incluir {LUNILLA}");
  if (!/juntos|juntas/i.test(ultima?.texto.es ?? "") || !/junts|juntes/i.test(ultima?.texto.ca ?? "")) err("la última página debe acabar con la frase para decir juntos («todos juntos…» / «tots junts…»)");
  const c = COLECCIONES.find((x) => x.id === p.coleccion)!;
  const usaTema = [p.portada, ...p.paginas.map((x) => x.escena)].some((e) => e.includes("{TEMA."));
  if (usaTema) for (const t of c.temas) if (!p.escenasTema?.[t.id]) err(`faltan escenasTema para ${t.id}`);
  const marcEsc = /\{(NINO|COMPA|AFICION|CIUDAD|LUGAR|BEBE|LUNILLA|COLOR|TEMA\.[a-z]+)\}/g;
  for (const [i, pg] of p.paginas.entries()) {
    const resto = pg.escena.replace(marcEsc, "");
    if (/[{}]/.test(resto)) err(`p${i + 1}: marcador desconocido en escena: ${pg.escena}`);
    if (/[áéíóúñ¿¡]/i.test(pg.escena)) err(`p${i + 1}: la escena debe estar en inglés`);
    if (!pg.escena.includes("{NINO}") && !/no child|without the child/i.test(pg.escena)) err(`p${i + 1}: la escena no incluye {NINO}`);
  }
  let n = 0;
  const nombres: Record<string, string> = { m: "Oriol", f: "Martina" };
  for (const t of c.temas)
    for (const idioma of ["es", "ca"] as const)
      for (const genero of ["m", "f"] as const)
        for (const comp of COMPANEROS)
          for (const af of AFICIONES)
            for (const ciudad of ["Lleida", "Alcarràs", "Zaragoza"]) {
              n++;
              const d: DatosNino = {
                nombre: n % 3 === 0 ? (genero === "m" ? "Pau" : "Anna") : nombres[genero], edad: banda === "peques" ? 3 : 6, genero, ciudad,
                companero: comp.id, mascota: "Nube", aficion: af.id, coleccion: p.coleccion, tema: t.id, idioma,
                bebe: n % 2 ? "Nora" : undefined, bebeGenero: n % 4 < 2 ? "f" : "m",
                arropa: ARROPA[n % ARROPA.length].id, color: COLORES[n % COLORES.length].id,
                amigo: n % 3 ? undefined : "Hugo", amigoGenero: "m",
              };
              const textos = [rellenar(p.titulo[idioma], d), ...p.paginas.map((pg) => rellenar(pg.texto[idioma], d))];
              let conNombre = 0;
              for (const [i, s] of textos.entries()) {
                if (quedanMarcadores(s)) err(`${t.id}/${idioma}/p${i}: marcadores sueltos: ${s}`);
                if (/(?<![\p{L}'])(de|a) el(?!\p{L})/iu.test(s) || (idioma === "ca" && /(?<![\p{L}'])(de|a|per) els?(?!\p{L})/iu.test(s))) err(`${t.id}/${idioma}/p${i}: contracción: ${s}`);
                if (/\s[,.]|,,|\.\./.test(s.replace(/…/g, ""))) err(`${t.id}/${idioma}/p${i}: puntuación: ${s}`);
                if (i > 0 && s.length > B.maxCaracteres) err(`${t.id}/${idioma}/p${i}: ${s.length} caracteres (máx ${B.maxCaracteres})`);
                if (i > 0 && s.includes(d.nombre)) conNombre++;
              }
              if (conNombre < Math.ceil(p.paginas.length / 2)) err(`${t.id}/${idioma}: el nombre sale solo en ${conNombre} páginas`);
            }
  return errores;
}

