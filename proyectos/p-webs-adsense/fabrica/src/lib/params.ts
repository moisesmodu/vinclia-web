// Parámetros legales y fiscales por país y año (SESIONES.md, regla 8).
// Estructura: params/<pais>/pais.json y params/<pais>/<anio>/<bloque>.json
// Nada de cifras legales dentro del código: todo sale de aquí.

// Un glob por país: al compilar un sitio, import.meta.env.PAIS (astro.config.mjs) es una constante y el empaquetador
// descarta los parámetros de los otros países, así el JavaScript del navegador solo lleva los de su país.
// Sin PAIS (pruebas) se cargan todos.
type Mapa = Record<string, any>;

// calendario.json no es un bloque de parámetros: lo carga src/lib/calc/calendario.ts solo donde hace falta
const ES: Mapa = import.meta.glob(['../../params/es/*/*.json', '!../../params/es/*/calendario.json'], { eager: true, import: 'default' });
const US: Mapa = import.meta.glob('../../params/us/*/*.json', { eager: true, import: 'default' });
const PAISES: Mapa = import.meta.glob('../../params/*/pais.json', { eager: true, import: 'default' });
const PAIS = import.meta.env.PAIS as string | undefined;
const archivos: Mapa = PAIS === 'es' ? ES : PAIS === 'us' ? US : { ...ES, ...US };
const paises: Mapa = PAISES;

export type Bloques = { laboral: any; fiscal: any; anio: number; pais: string; provisional: boolean };

export function pais(codigo: string): any {
  const p = paises[`../../params/${codigo}/pais.json`];
  if (!p) throw new Error(`Sin configuración de país: ${codigo}`);
  return p;
}

export function anios(codigo: string): number[] {
  const set = new Set<number>();
  for (const k of Object.keys(archivos)) {
    const m = k.match(/params\/([^/]+)\/(\d{4})\//);
    if (m && m[1] === codigo) set.add(Number(m[2]));
  }
  return [...set].sort();
}

export function params(codigo: string, anio: number): Bloques {
  const laboral = archivos[`../../params/${codigo}/${anio}/laboral.json`];
  const fiscal = archivos[`../../params/${codigo}/${anio}/fiscal.json`];
  if (!laboral || !fiscal) throw new Error(`Faltan parámetros ${codigo}/${anio}`);
  return {
    laboral,
    fiscal,
    anio,
    pais: codigo,
    provisional: laboral.estado === 'provisional' || fiscal.estado === 'provisional',
  };
}
