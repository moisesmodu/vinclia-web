import marcaJson from '@/config/marca.json';
import paisJson from '@/config/paises/es.json';
import examensJson from '@/config/examens.json';
import convocatoriesJson from '@/config/convocatories.json';
import puntsJson from '@/config/punts.json';
import banc from '@/generado/banc.json';
import type { Banc, Convocatoria, Examen, Nivell, Punt } from './tipos';

export const marca = marcaJson;
export const pais = paisJson;
export const urlBase = () => process.env.NEXT_PUBLIC_URL || `https://${marca.dominio}`;

export const examens = examensJson.nivells as unknown as Record<Nivell, Examen>;
export const examen = (n: Nivell): Examen => examens[n];
export const nivellsActius = (): Nivell[] => (Object.keys(examens) as Nivell[]).filter((n) => examens[n].actiu);
export const convocatories = convocatoriesJson.convocatories as unknown as Convocatoria[];
export const convocatoriesDe = (n: Nivell) => convocatories.filter((c) => c.nivell === n || c.nivells?.includes(n));
export const convocatoria = (id: string) => convocatories.find((c) => c.id === id);
export const punts = puntsJson.punts as unknown as Punt[];
export const puntsDe = (n: Nivell) => punts.filter((p) => p.nivells.includes(n));

export const BANC = banc as unknown as Banc;
export const itemsDe = (n: Nivell) => BANC.items.filter((i) => i.nivell === n);
export const regla = (id: string) => BANC.regles[id];
export const text = (id: string) => BANC.textos[id];
export const tasca = (id: string) => BANC.tasques[id];
export const simulacresDe = (n: Nivell) => BANC.simulacres.filter((s) => s.nivell === n);
export const paginaSeo = (slug: string) => BANC.seo.find((p) => p.slug === slug);

export const preu = (centims: number) => `${(centims / 100).toFixed(2).replace('.', ',')} €`;
