export type Idioma = 'ca' | 'es';
export const IDIOMAS: Idioma[] = ['ca', 'es'];
export type Texto = Record<Idioma, string>;

export type Fuente = {
  tipo: 'boe' | 'web';
  id?: string;
  norma: string;
  articulo?: string;
  articulos?: string;
  url?: string;
};

export type Tema = {
  n: number;
  titulo: Texto;
  slug: string;
  bloque?: Texto;
  fuentes: Fuente[];
  peso?: number;
};

export type Convocatoria = {
  referencia: string;
  diario: string;
  numero?: string;
  fecha?: string;
  url?: string;
  pdfUrl?: string;
  plazas?: number;
  estado?: string;
  notas?: string;
  verificado?: string;
};

export type FormatoExamen = {
  preguntas: number;
  reserva?: number;
  opciones: number;
  minutos: number;
  penalizacion: number;
  notaMaxima?: number;
  notaCorte?: number;
  descripcion?: Texto;
  otrasPruebas?: Record<Idioma, string[]>;
};

export type Oposicion = {
  slug: string;
  pais: string;
  activa: boolean;
  nombre: Texto;
  nombreCorto: Texto;
  cuerpo?: Texto;
  administracion: string;
  convocatoria: Convocatoria;
  examen: FormatoExamen;
  temas: Tema[];
  examenesAnteriores?: { anio: number; titulo: string; url?: string; plantilla?: string }[];
  seo?: { palabrasClave?: Record<Idioma, string[]> };
};

export type TextoPregunta = { enunciado: string; opciones: string[]; explicacion: string };

export type Pregunta = {
  id: string;
  tema: number;
  dificultad: number;
  correcta: number;
  ca: TextoPregunta;
  es: TextoPregunta;
  fuente: Fuente;
  cita?: string;
  origen: 'ia' | 'examen-oficial';
  examen?: { convocatoria: string; anio: number; numero?: number };
  gratis?: boolean;
  verificacion?: { maquina: string; revision: string };
};

export type Banco = {
  oposicion: Oposicion;
  preguntas: Pregunta[];
  actualizado: string;
  resumen: { total: number; porTema: Record<number, number>; verificadasLiteral: number; examenOficial: number };
};

/** Lo que se puede enseñar en páginas públicas y sin suscripción. */
export type BancoPublico = Omit<Banco, 'preguntas'> & { gratis: Pregunta[]; ejemplos: Record<number, Pick<Pregunta, 'id' | 'ca' | 'es'> | undefined> };
