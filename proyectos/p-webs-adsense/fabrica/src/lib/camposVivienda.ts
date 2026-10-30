// Campos y textos comunes de las calculadoras de vivienda (PisoClaro, src/calculadoras/viv-*.ts).
// Las cifras salen de params/es/<año>/vivienda.json; aquí solo hay nombres, etiquetas y valores de ejemplo editables.
import { tt, type Campo, type T, type Txt, type Lang } from './def';
import { params, anios } from './params';
import { ultimo, nombreMes } from './calc/vivienda';

/** Comunidades y ciudades autónomas de la vivienda: las 15 de régimen común, Ceuta, Melilla y las dos forales. */
export const COMUNIDADES_VIV: Record<string, { es: string; ca: string; slug: T; foral?: boolean }> = {
  AN: { es: 'Andalucía', ca: 'Andalusia', slug: tt('andalucia', 'andalusia') },
  AR: { es: 'Aragón', ca: 'Aragó', slug: tt('aragon', 'arago') },
  AS: { es: 'Asturias', ca: 'Astúries', slug: tt('asturias', 'asturies') },
  IB: { es: 'Illes Balears', ca: 'Illes Balears', slug: tt('baleares', 'illes-balears') },
  CN: { es: 'Canarias', ca: 'Canàries', slug: tt('canarias', 'canaries') },
  CB: { es: 'Cantabria', ca: 'Cantàbria', slug: tt('cantabria', 'cantabria') },
  CL: { es: 'Castilla y León', ca: 'Castella i Lleó', slug: tt('castilla-y-leon', 'castella-i-lleo') },
  CM: { es: 'Castilla-La Mancha', ca: 'Castella-la Manxa', slug: tt('castilla-la-mancha', 'castella-la-manxa') },
  CT: { es: 'Cataluña', ca: 'Catalunya', slug: tt('cataluna', 'catalunya') },
  EX: { es: 'Extremadura', ca: 'Extremadura', slug: tt('extremadura', 'extremadura') },
  GA: { es: 'Galicia', ca: 'Galícia', slug: tt('galicia', 'galicia') },
  MD: { es: 'Comunidad de Madrid', ca: 'Comunitat de Madrid', slug: tt('madrid', 'madrid') },
  MC: { es: 'Región de Murcia', ca: 'Regió de Múrcia', slug: tt('murcia', 'murcia') },
  RI: { es: 'La Rioja', ca: 'La Rioja', slug: tt('la-rioja', 'la-rioja') },
  VC: { es: 'Comunitat Valenciana', ca: 'Comunitat Valenciana', slug: tt('comunidad-valenciana', 'comunitat-valenciana') },
  NA: { es: 'Navarra', ca: 'Navarra', slug: tt('navarra', 'navarra'), foral: true },
  PV: { es: 'País Vasco', ca: 'País Basc', slug: tt('pais-vasco', 'pais-basc'), foral: true },
  CE: { es: 'Ceuta', ca: 'Ceuta', slug: tt('ceuta', 'ceuta') },
  ML: { es: 'Melilla', ca: 'Melilla', slug: tt('melilla', 'melilla') },
};
export const COD_VIV = Object.keys(COMUNIDADES_VIV);
export const nomViv = (c: string, l: Lang) => COMUNIDADES_VIV[c]?.[l] ?? c;
/** «en Cataluña» / «a Catalunya». */
export const enViv = (c: string, l: Lang) => `${l === 'es' ? 'en' : 'a'} ${nomViv(c, l)}`;

export const campoComunidadViv = (def = 'CT', ayuda?: T): Campo => ({
  id: 'ccaa', tipo: 'select', def, etiqueta: tt('Comunidad autónoma de la vivienda', 'Comunitat autònoma de l’habitatge'),
  opciones: COD_VIV.map((v) => ({ v, t: tt(COMUNIDADES_VIV[v].es + (COMUNIDADES_VIV[v].foral ? ' (foral)' : ''), COMUNIDADES_VIV[v].ca + (COMUNIDADES_VIV[v].foral ? ' (foral)' : '')) })),
  ayuda,
});

// Parámetros de vivienda del último año publicado, para los valores por defecto de los formularios.
// En los sitios que no llevan el bloque (NetoClaro…) devuelve undefined y los valores quedan a 0: allí nunca se muestran.
export const V0 = (): any => { const a = anios('es'); return a.length ? params('es', a[a.length - 1]).vivienda : undefined; };
export const euriborDef = (): number => (V0() ? ultimo(V0().euribor_12m.serie).valor : 0);
export const iravDef = (): number => (V0() ? ultimo(V0().irav_alquiler.serie).valor : 0);
export const ineDef = (k: string): number => V0()?.hipotecas_ine?.[k] ?? 0;
export const criterioDef = (k: string): number => V0()?.criterios_editoriales_no_normativos?.[k] ?? 0;
/** Etiquetas de las dos opciones de comisión de la variable (Ley 5/2019, art. 23) con las cifras de los parámetros. */
export function opcionesComisionVariable(): { v: string; t: T }[] {
  const c = V0()?.comision_amortizacion_anticipada?.variable;
  const et = (o: any): T => (o ? tx((l) => `${l === 'es' ? 'Hasta el' : 'Fins al'} ${pct(o.tope_pct, l)} ${l === 'es' ? `los ${o.durante_anios} primeros años` : `els ${o.durante_anios} primers anys`}`) : tt('—', '—'));
  return [{ v: 'a', t: et(c?.opcion_a) }, { v: 'b', t: et(c?.opcion_b) }];
}
/** Comunidades sin tipo de AJD en los parámetros: el formulario pide el tipo. */
export const sinAJD = (ccaa: string): boolean => { const c = V0()?.ajd_documentos_notariales?.comunidades?.[ccaa]; return !c || c.tipo_general == null; };
export const indirectoEspecial = (ccaa: string) => ccaa === 'CN' || ccaa === 'CE' || ccaa === 'ML';

/** Aviso con el mes del último Euríbor y si está pendiente de cotejo en el BOE. */
export function avisoEuribor(V: any): T {
  const u = ultimo(V.euribor_12m.serie);
  const v = String(u.valor).replace('.', ',');
  return u.pendiente_cotejo
    ? tt(`Euríbor de ${nombreMes(u.mes, 'es')}: ${v} %, según la prensa especializada; pendiente de cotejar con el BOE.`, `Euríbor de ${nombreMes(u.mes, 'ca')}: ${v} %, segons la premsa especialitzada; pendent de confrontar amb el BOE.`)
    : tt(`Euríbor de ${nombreMes(u.mes, 'es')}: ${v} % (dato oficial del Banco de España).`, `Euríbor de ${nombreMes(u.mes, 'ca')}: ${v} % (dada oficial del Banc d’Espanya).`);
}
export const avisoFEIN: T = tt('Cálculo orientativo. La oferta vinculante es la FEIN que te entrega el banco (Ley 5/2019).', 'Càlcul orientatiu. L’oferta vinculant és la FEIN que et lliura el banc (Llei 5/2019).');
export const avisoPendiente = (c: string): T => tt(`El tipo de ${nomViv(c, 'es')} sale de comparativas y aún no se ha cotejado con el boletín oficial: compruébalo antes de firmar.`, `El tipus de ${nomViv(c, 'ca')} surt de comparatives i encara no s’ha confrontat amb el butlletí oficial: comprova’l abans de signar.`);
export const avisoForal = (c: string): T => tt(`${nomViv(c, 'es')} tiene régimen foral: el tipo es el general citado por las comparativas; consulta su hacienda foral.`, `${nomViv(c, 'ca')} té règim foral: el tipus és el general citat per les comparatives; consulta’n la hisenda foral.`);

export const eur = (n: number, l: Lang, dec = 0) => new Intl.NumberFormat(l === 'es' ? 'es-ES' : 'ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n);
export const pct = (n: number, l: Lang) => new Intl.NumberFormat(l === 'es' ? 'es-ES' : 'ca-ES', { maximumFractionDigits: 3 }).format(n) + ' %';
/** Texto en los dos idiomas con importes formateados: tx((l) => …). */
export const tx = (f: (l: Lang) => string): T => ({ es: f('es'), ca: f('ca') });
export const anyo = (n: number, l: Lang) => `${n} ${l === 'es' ? (n === 1 ? 'año' : 'años') : (n === 1 ? 'any' : 'anys')}`;
export const plazoTxt = (meses: number, l: Lang) => { const a = Math.floor(meses / 12), m = meses % 12; return `${anyo(a, l)}${m ? ` ${l === 'es' ? 'y' : 'i'} ${m} ${l === 'es' ? 'meses' : 'mesos'}` : ''}`; };

// Campos repetidos
export const campoImporte = (def = 180000): Campo => ({ id: 'importe', tipo: 'numero', def, min: 0, paso: 1000, sufijo: '€', etiqueta: tt('Importe de la hipoteca', 'Import de la hipoteca') });
export const campoPlazo = (def = 30): Campo => ({ id: 'anios', tipo: 'numero', def, min: 1, max: 40, paso: 1, etiqueta: tt('Plazo en años', 'Termini en anys') });
export const campoNueva: Campo = { id: 'nueva', tipo: 'select', def: 'usada', etiqueta: tt('Tipo de vivienda', 'Tipus d’habitatge'), opciones: [{ v: 'usada', t: tt('Segunda mano (ITP)', 'Segona mà (ITP)') }, { v: 'nueva', t: tt('Obra nueva (IVA y AJD)', 'Obra nova (IVA i AJD)') }] };
export const camposHonorarios: Campo[] = [
  { id: 'gestoria', tipo: 'numero', def: 300, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Gestoría (precio libre, ejemplo)', 'Gestoria (preu lliure, exemple)'), ayuda: tt('Si la hipoteca la tramita el banco, la gestoría la paga él (Ley 5/2019). Pon 0 si no la contratas.', 'Si la hipoteca la tramita el banc, la gestoria la paga ell (Llei 5/2019). Posa 0 si no la contractes.') },
  { id: 'tasacion', tipo: 'numero', def: 350, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Tasación (precio libre, ejemplo)', 'Taxació (preu lliure, exemple)'), ayuda: tt('Solo si pides hipoteca: la paga el comprador.', 'Només si demanes hipoteca: la paga el comprador.') },
];
export const campoTipoAJD: Campo = { id: 'tipoAJD', tipo: 'numero', def: 1.5, min: 0, max: 5, paso: 0.05, sufijo: '%', etiqueta: tt('Tipo de AJD de tu comunidad', 'Tipus d’AJD de la teva comunitat'), ayuda: tt('Aún no tenemos el tipo cotejado de esta comunidad: escribe el de su ley de tributos cedidos.', 'Encara no tenim el tipus confrontat d’aquesta comunitat: escriu el de la seva llei de tributs cedits.'), si: (v) => v.nueva === 'nueva' && !indirectoEspecial(v.ccaa) && sinAJD(v.ccaa) };
export const campoIndirecto: Campo = { id: 'indirecto', tipo: 'numero', def: 5, min: 0, max: 10, paso: 0.5, sufijo: '%', etiqueta: tt('Tipo de IGIC (Canarias) o IPSI (Ceuta y Melilla)', 'Tipus d’IGIC (Canàries) o IPSI (Ceuta i Melilla)'), ayuda: tt('Las fuentes discrepan (IGIC del 5 % o del 7 %): confirma el tipo con la hacienda canaria o local.', 'Les fonts discrepen (IGIC del 5 % o del 7 %): confirma el tipus amb la hisenda canària o local.'), si: (v) => v.nueva === 'nueva' && indirectoEspecial(v.ccaa) };

export const n = (x: unknown) => Number(x) || 0;
export type { Txt };
