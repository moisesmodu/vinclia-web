/** Ratxa desacoblada de l'objectiu diari (Duolingo, mesurat: +3,3 % de retenció a 14 dies): es manté amb una minisessió de 2 minuts
 *  i hi ha dues congelacions al mes que s'apliquen soles. Pantalla de compromís de 7, 14 o 30 dies sense opció preseleccionada. */
export type EstatRatxa = { dies: string[]; congelacions: Record<string, string[]>; compromis: { dies: 7 | 14 | 30; inici: string } | null; compromisVist: boolean };

export const avuiISO = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const resta = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - n); return avuiISO(d); };

export const ratxaBuida = (): EstatRatxa => ({ dies: [], congelacions: {}, compromis: null, compromisVist: false });

export function registrarDia(r: EstatRatxa, dia = avuiISO()): EstatRatxa {
  if (r.dies.includes(dia)) return r;
  return { ...r, dies: [...r.dies, dia].sort().slice(-400) };
}

/** Calcula la ratxa actual aplicant congelacions automàtiques (màxim `maxMes` per mes natural). Retorna també les usades aquest mes. */
export function ratxaActual(r: EstatRatxa, avui = avuiISO(), maxMes = 2): { dies: number; congelacionsMes: number; viva: boolean } {
  const set = new Set(r.dies);
  const mes = avui.slice(0, 7);
  const usades = { ...r.congelacions };
  const usadesMes = (m: string) => (usades[m] ?? []).length;
  let n = 0;
  let dia = set.has(avui) ? avui : resta(avui, 1);
  // Si avui encara no s'ha fet res, la ratxa compta des d'ahir (no es trenca fins a mitjanit).
  while (true) {
    if (set.has(dia)) { n++; dia = resta(dia, 1); continue; }
    const m = dia.slice(0, 7);
    if ((usades[m] ?? []).includes(dia) || usadesMes(m) < maxMes) { usades[m] = Array.from(new Set([...(usades[m] ?? []), dia])); dia = resta(dia, 1); continue; }
    break;
  }
  if (n === 0) return { dies: 0, congelacionsMes: usadesMes(mes), viva: false };
  return { dies: n, congelacionsMes: usadesMes(mes), viva: true };
}

/** Persisteix les congelacions consumides fins avui (per no "regalar-les" dues vegades). */
export function consolidarCongelacions(r: EstatRatxa, avui = avuiISO(), maxMes = 2): EstatRatxa {
  const set = new Set(r.dies);
  const usades: Record<string, string[]> = JSON.parse(JSON.stringify(r.congelacions));
  let dia = resta(avui, 1);
  for (let i = 0; i < 400; i++) {
    if (set.has(dia)) { dia = resta(dia, 1); continue; }
    const m = dia.slice(0, 7);
    if ((usades[m] ?? []).includes(dia)) { dia = resta(dia, 1); continue; }
    if ((usades[m] ?? []).length < maxMes && r.dies.some((x) => x < dia)) { usades[m] = [...(usades[m] ?? []), dia]; dia = resta(dia, 1); continue; }
    break;
  }
  return { ...r, congelacions: usades };
}

export function progresCompromis(r: EstatRatxa, avui = avuiISO()): { fets: number; total: number } | null {
  if (!r.compromis) return null;
  const { dies, inici } = r.compromis;
  const fets = r.dies.filter((d) => d >= inici && d <= avui).length;
  return { fets: Math.min(fets, dies), total: dies };
}
