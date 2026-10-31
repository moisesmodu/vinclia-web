// Parámetros legales y fiscales por país y año (SESIONES.md, regla 8).
// Estructura: params/<pais>/pais.json y params/<pais>/<anio>/<bloque>.json
// Nada de cifras legales dentro del código: todo sale de aquí.

// Un glob por país: al compilar un sitio, import.meta.env.PAIS (astro.config.mjs) es una constante y el empaquetador
// descarta los parámetros de los otros países, así el JavaScript del navegador solo lleva los de su país.
// Sin PAIS (pruebas) se cargan todos.
type Mapa = Record<string, any>;

const ES: Mapa = import.meta.glob('../../params/es/*/{laboral,fiscal}.json', { eager: true, import: 'default' });
const US: Mapa = import.meta.glob('../../params/us/*/{laboral,fiscal}.json', { eager: true, import: 'default' });
// Bloques extra de un sitio concreto (params/<pais>/<anio>/<bloque>.json, p. ej. vivienda.json). Solo se empaquetan
// en los sitios que los declaran en sitio.json → «bloques» (astro.config.mjs define BLOQUES_EXTRA); así el
// JavaScript de NetoClaro o ImpuestoClaro no lleva los parámetros de vivienda. Sin la variable (pruebas), todos.
// calendario.json no es un bloque de parámetros: lo carga src/lib/calc/calendario.ts solo donde hace falta
const EXTRA: Mapa = import.meta.glob(['../../params/*/*/*.json', '!../../params/*/*/{laboral,fiscal}.json', '!../../params/*/*/calendario.json'], { eager: true, import: 'default' });
const CON_EXTRA = import.meta.env.BLOQUES_EXTRA as boolean | undefined;
const PAISES: Mapa = import.meta.glob('../../params/*/pais.json', { eager: true, import: 'default' });
const PAIS = import.meta.env.PAIS as string | undefined;
const base: Mapa = PAIS === 'es' ? ES : PAIS === 'us' ? US : { ...ES, ...US };
const archivos: Mapa = CON_EXTRA === false ? base : { ...base, ...EXTRA };
const paises: Mapa = PAISES;

export type Bloques = { laboral: any; fiscal: any; anio: number; pais: string; provisional: boolean; vivienda?: any; [bloque: string]: any };

export function pais(codigo: string): any {
  const p = paises[`../../params/${codigo}/pais.json`];
  if (!p) throw new Error(`Sin configuración de país: ${codigo}`);
  return p;
}

export function anios(codigo: string): number[] {
  const set = new Set<number>();
  for (const k of Object.keys(archivos)) {
    const m = k.match(/params\/([^/]+)\/(\d{4})\/(laboral|fiscal)\.json$/);
    if (m && m[1] === codigo) set.add(Number(m[2]));
  }
  return [...set].sort();
}

export function params(codigo: string, anio: number): Bloques {
  const laboral = archivos[`../../params/${codigo}/${anio}/laboral.json`];
  const fiscal = archivos[`../../params/${codigo}/${anio}/fiscal.json`];
  if (!laboral || !fiscal) throw new Error(`Faltan parámetros ${codigo}/${anio}`);
  // Bloques extra del mismo país y año (vivienda.json…), con su nombre de archivo como clave
  const extra: Record<string, any> = {};
  const pre = `../../params/${codigo}/${anio}/`;
  for (const [k, v] of Object.entries(archivos)) {
    if (!k.startsWith(pre)) continue;
    const n = k.slice(pre.length).replace(/\.json$/, '');
    if (n !== 'laboral' && n !== 'fiscal') extra[n] = v;
  }
  return {
    ...extra,
    laboral,
    fiscal,
    anio,
    pais: codigo,
    provisional: laboral.estado === 'provisional' || fiscal.estado === 'provisional' || Object.values(extra).some((b: any) => b?.estado === 'provisional'),
  };
}
