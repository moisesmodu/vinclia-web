// Lector y escritor de CSV mínimo (comillas dobles y comas). Sin dependencias.
const archivos = import.meta.glob('../../sitios/*/{datos,programaticas}/*.csv', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function parseCSV(s: string): Record<string, string>[] {
  const filas: string[][] = [];
  let campo = '', fila: string[] = [], q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') q = false;
      else campo += c;
    } else if (c === '"') q = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      fila.push(campo); campo = '';
      if (fila.some((x) => x !== '')) filas.push(fila);
      fila = [];
    } else campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); if (fila.some((x) => x !== '')) filas.push(fila); }
  const [cab, ...resto] = filas;
  return resto.map((f) => Object.fromEntries(cab.map((k, i) => [k.trim(), (f[i] ?? '').trim()])));
}

export function leerCSV(sitio: string, carpeta: 'datos' | 'programaticas', nombre: string): Record<string, string>[] {
  const s = archivos[`../../sitios/${sitio}/${carpeta}/${nombre}`];
  if (s == null) throw new Error(`No existe sitios/${sitio}/${carpeta}/${nombre}`);
  return parseCSV(s);
}

export function aCSV(cab: string[], filas: (string | number)[][]): string {
  const e = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cab.map(e).join(','), ...filas.map((f) => f.map(e).join(','))].join('\n') + '\n';
}
