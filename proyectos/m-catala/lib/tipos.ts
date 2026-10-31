export type Idioma = 'ca' | 'es';
export const IDIOMAS: Idioma[] = ['ca', 'es'];
export type IdiomaExpl = 'ca' | 'es' | 'en' | 'ar' | 'ro' | 'fr';
export const IDIOMAS_EXPL: IdiomaExpl[] = ['ca', 'es', 'en', 'ar', 'ro', 'fr'];
export type Texto = Record<Idioma, string>;
export type Nivell = 'B1' | 'B2' | 'C1' | 'C2';
export const NIVELLS: Nivell[] = ['B1', 'B2', 'C1', 'C2'];
export type Area = 'us' | 'lectura' | 'co' | 'escrit' | 'oral';
export type TipusItem = 'buits' | 'transformacio' | 'castellanismes' | 'lexic' | 'dictat' | 'lectura' | 'co';

export type Regla = {
  id: string; punt: string; nivells: Nivell[]; titol: { ca: string };
  regla: Record<IdiomaExpl, string>; exemples: { malament?: string; be: string }[]; font: { nom: string; url: string };
};

export type Item = {
  id: string; nivell: Nivell; area: Area; tipus: TipusItem; punt: string; regla: string; dificultat: number;
  enunciat?: string; text?: string; textId?: string; opcions?: string[]; resposta: string | string[] | number; error?: string;
  pista?: string; focus?: string[]; variants?: string[]; diagnostic: boolean; gratis: boolean; revisio: 'sessio' | 'ia' | 'huma';
};

export type Pregunta = { id: string; enunciat: string; opcions: string[]; resposta: number };
export type TextCL = { id: string; nivell: Nivell; area: 'lectura' | 'co'; titol: string; genere?: string; text: string; paraules?: number; veus?: string[]; preguntes: Pregunta[]; dificultat?: number };

export type Tasca = {
  id: string; nivell: Nivell; tipus: 'correu' | 'text-informatiu' | 'argumentatiu-3-fonts' | 'nota' | 'carta-formal' | 'argumentatiu';
  titol: string; enunciat: string; fonts?: { titol: string; text: string }[]; paraulesMin: number; paraulesMax: number; minuts: number; registre?: string; guia: { ca: string };
};

export type Simulacre = { id: string; nivell: Nivell; nom: string; arees: { us?: { items: string[] }; escrit?: { tasca?: string; tasques?: string[] }; co?: { textos: string[] }; lectura?: { textos: string[] } } };

export type So = { id: string; nom: Texto; descripcio: Texto; paraules: string[]; parelles?: (string | string[])[]; pista?: Texto };
export type LecturaOral = { id: string; nivell: Nivell | 'general'; titol: string; text: string; sons: string[]; paraulesClau: Record<string, string[]> };

export type Punt = { id: string; nom: Texto; nivells: Nivell[]; pes: number };

export type AreaExamen = {
  id: Area; part: 'escrita' | 'oral'; nom: Texto; pes: number; minuts: number; preparacio?: number; items?: number; minimPunts?: number; puntsMax?: number;
  tasques?: { tipus: string; paraules?: number }[]; detall?: { ca: string }; verificat: boolean;
};
export type Examen = {
  nom: Texto; curt: string; actiu: boolean; sessio?: number; aptoGlobal: number | null;
  parts: Record<'escrita' | 'oral', { pes: number; minim: number | null; minimPunts?: string }>; arees: AreaExamen[]; usos: Texto;
};

export type Convocatoria = {
  id: string; organisme: string; nivell: Nivell; nivells?: Nivell[]; nom: Texto; inscripcio?: { inici: string; fi: string; estimada?: boolean };
  prova: string; resultats?: string; taxa?: number | null; taxaNota?: Texto; verificat: boolean; url: string; llocs?: Texto;
};

export type PaginaSeo = {
  slug: string; nivell?: string; tipus: string; titol: Texto; descripcio: Texto; paraulesClau: Record<Idioma, string[]>;
  seccions: Record<Idioma, { h2: string; text: string }[]>; faq?: Record<Idioma, { p: string; r: string }[]>; cta?: Texto;
};

export type Banc = {
  actualitzat: string;
  regles: Record<string, Regla>;
  items: Item[];
  textos: Record<string, TextCL>;
  tasques: Record<string, Tasca>;
  simulacres: Simulacre[];
  oral: { sons: So[]; lectures: LecturaOral[]; l1: string };
  seo: PaginaSeo[];
  resum: { total: number; perNivell: Record<string, number>; perTipus: Record<string, number>; gratis: number; diagnostic: number; revisioHumana: number };
};

export type Motiu = 'oposicions' | 'feina' | 'sanitat' | 'docencia' | 'residencia' | 'personal';
export type Perfil = { nivell: Nivell; convocatoria: string; motiu: Motiu; l1: string; minuts: 10 | 15 | 20; idiomaExpl: IdiomaExpl; creat: string };
