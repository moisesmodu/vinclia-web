/** Ratxa desacoblada de l'objectiu diari (Duolingo, mesurat: +3,3 % de retenció a 14 dies): es manté amb una minisessió de 2 minuts
 *  i hi ha dues congelacions al mes que s'apliquen soles. Pantalla de compromís de 7, 14 o 30 dies sense opció preseleccionada.
 *  Límits de les congelacions: màxim `maxMes` (2) per mes natural i mai més de `maxSeguits` (2) dies seguits congelats, també quan la
 *  seqüència travessa un canvi de mes (abans, 31/1 + 1/2 + 2/2 + 3/2 podien consumir les dues de cada mes i mantenir una ratxa de 4 dies
 *  sense pràctica). El compromís caduca en complir-se els dies (`inici + dies − 1` és l'últim dia). */
export type EstatRatxa = { dies: string[]; congelacions: Record<string, string[]>; compromis: { dies: 7 | 14 | 30; inici: string } | null; compromisVist: boolean };

export const avuiISO = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const resta = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - n); return avuiISO(d); };
const suma = (iso: string, n: number) => resta(iso, -n);

export const MAX_CONGELACIONS_MES = 2;
export const MAX_CONGELACIONS_SEGUIDES = 2;

export const ratxaBuida = (): EstatRatxa => ({ dies: [], congelacions: {}, compromis: null, compromisVist: false });

/** Registra un dia de pràctica. També tanca el compromís si ja ha caducat (el dia registrat és posterior al seu últim dia). */
export function registrarDia(r: EstatRatxa, dia = avuiISO()): EstatRatxa {
  const base = compromisCaducat(r, dia) ? { ...r, compromis: null } : r;
  if (base.dies.includes(dia)) return base;
  return { ...base, dies: [...base.dies, dia].sort().slice(-400) };
}

/** Recorre enrere des d'`inici` aplicant les congelacions amb els dos límits (per mes i seguides). Retorna els dies de ratxa i les
 *  congelacions consumides (les ja guardades a `r.congelacions` compten com a usades del seu mes). */
function recorrer(r: EstatRatxa, inici: string, maxMes: number, maxSeguits: number): { n: number; usades: Record<string, string[]> } {
  const set = new Set(r.dies);
  const usades: Record<string, string[]> = JSON.parse(JSON.stringify(r.congelacions ?? {}));
  const usadesMes = (m: string) => (usades[m] ?? []).length;
  const primer = r.dies.length ? [...r.dies].sort()[0] : null;
  let n = 0, seguides = 0, dia = inici;
  for (let i = 0; i < 400; i++) {
    if (set.has(dia)) { n++; seguides = 0; dia = resta(dia, 1); continue; }
    if (!primer || dia < primer) break; // abans del primer dia no hi ha res a congelar
    const m = dia.slice(0, 7);
    const jaUsada = (usades[m] ?? []).includes(dia);
    if (seguides >= maxSeguits) break;
    if (jaUsada || usadesMes(m) < maxMes) { usades[m] = Array.from(new Set([...(usades[m] ?? []), dia])); seguides++; dia = resta(dia, 1); continue; }
    break;
  }
  return { n, usades };
}

/** Calcula la ratxa actual aplicant congelacions automàtiques (màxim `maxMes` per mes natural i `maxSeguits` dies seguits). Retorna també
 *  les usades aquest mes. Si avui encara no s'ha fet res, la ratxa compta des d'ahir (no es trenca fins a mitjanit). */
export function ratxaActual(r: EstatRatxa, avui = avuiISO(), maxMes = MAX_CONGELACIONS_MES, maxSeguits = MAX_CONGELACIONS_SEGUIDES): { dies: number; congelacionsMes: number; viva: boolean } {
  const set = new Set(r.dies);
  const mes = avui.slice(0, 7);
  const { n, usades } = recorrer(r, set.has(avui) ? avui : resta(avui, 1), maxMes, maxSeguits);
  const congelacionsMes = (usades[mes] ?? []).length;
  if (n === 0) return { dies: 0, congelacionsMes, viva: false };
  return { dies: n, congelacionsMes, viva: true };
}

/** Persisteix les congelacions consumides fins ahir (per no "regalar-les" dues vegades), amb els mateixos límits que `ratxaActual`. */
export function consolidarCongelacions(r: EstatRatxa, avui = avuiISO(), maxMes = MAX_CONGELACIONS_MES, maxSeguits = MAX_CONGELACIONS_SEGUIDES): EstatRatxa {
  const { usades } = recorrer(r, resta(avui, 1), maxMes, maxSeguits);
  return { ...r, congelacions: usades };
}

/** Últim dia del compromís (inclòs). */
export const fiCompromis = (c: NonNullable<EstatRatxa['compromis']>) => suma(c.inici, c.dies - 1);

/** El compromís ha caducat quan `avui` és posterior al seu últim dia. */
export const compromisCaducat = (r: EstatRatxa, avui = avuiISO()) => !!r.compromis && avui > fiCompromis(r.compromis);

/** Progrés del compromís: dies fets dins la finestra, total, últim dia i si s'ha acabat (fets = total o finestra exhaurida).
 *  Retorna null si no n'hi ha o si ja ha caducat (a partir de l'endemà de l'últim dia la barra desapareix). */
export function progresCompromis(r: EstatRatxa, avui = avuiISO()): { fets: number; total: number; fi: string; acabat: boolean } | null {
  if (!r.compromis) return null;
  const { dies, inici } = r.compromis;
  const fi = fiCompromis(r.compromis);
  if (avui > fi) return null;
  const fets = r.dies.filter((d) => d >= inici && d <= avui).length;
  return { fets: Math.min(fets, dies), total: dies, fi, acabat: fets >= dies || avui === fi };
}
