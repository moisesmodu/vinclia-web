import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

export type Accion = { fecha: string; texto: string; enlace?: string };
export type Competidor = { nombre: string; url?: string; precio?: string; debilidad?: string };
export type Repo = { nombre: string; url?: string; licencia?: string; uso?: string; estrellas?: string };
export type Lider = {
  nombre: string; url?: string; porQue?: string;
  modelo?: { propuesta?: string; precio?: string; embudo?: string; funciones?: string[]; retencion?: string; adquisicion?: string; tecnologia?: string; metricas?: string };
  loQueFunciona?: string[]; loQueFalla?: string[]; copiar?: string[]; mejorar?: string[]; adaptar?: string[]; planAccion?: string[];
};
export type Examen = { nivel: string; organismo: string; estructura: string; convocatorias: string; demanda: string; usos: string };
export type Juicio = { probabilidad: number; veredicto: string; exito: string; porQue: string; contra: string; parada: string };
export type Identidad = {
  familia: string; familiaNombre: string; marca: string; subtitulo?: string; alternativas: string[];
  promesa: Record<string, string>; voz: string; dominio: string; acento: string;
  colores: Record<string, string>; tipografia: { titulos: string; texto: string }; personalidad: string; motivo: string;
  logo: string; icono: string;
};

export type Estado = 'pendiente' | 'en construcción' | 'lanzado' | 'pausado' | 'descartado';

export type Proyecto = {
  clave: string; letra: string; nombre: string; marca: string; resumen: string;
  estado: Estado; orden: number; fechaLimite?: string;
  modelo: string; margenCliente: number; objetivoMes12: number;
  ingresosMes: number; costesMes: number; clientes: number;
  canal: string; enlaces: Record<string, string>;
  acciones: Accion[]; proximos: string[]; paraMoises: string[];
  mejoras: string[]; competidores: Competidor[]; repos: Repo[]; hallazgos: string[];
  lider?: Lider; segundoLider?: Lider; expansion?: string[]; juicio?: Juicio; examenes?: Examen[];
};

export type Cartera = {
  actualizado: string;
  objetivos: { nombre: string; mensual: number; plazo: string }[];
  escenario: string; costesFijosMes: number; inversionAcumulada: number;
  decisionesPendientes: { texto: string; donde?: string }[];
  reglas: string[];
  juicioCartera?: { p1000a6: number; p1000a12: number; p350a6: number; p350a12: number; mediana6: number; mediana12: number; nucleo: string[]; fecha: string };
};

const raiz = path.join(process.cwd(), '..');
const datos = path.join(process.cwd(), 'data');

export function cartera(): Cartera {
  return JSON.parse(fs.readFileSync(path.join(datos, 'cartera.json'), 'utf8'));
}

export function proyectos(): Proyecto[] {
  const lista: Proyecto[] = JSON.parse(fs.readFileSync(path.join(datos, 'proyectos.json'), 'utf8'));
  return lista.sort((a, b) => a.orden - b.orden);
}

export function identidad(clave: string): Identidad | null {
  const ruta = path.join(raiz, 'marcas', 'tokens.json');
  if (!fs.existsSync(ruta)) return null;
  const t = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const p = t.proyectos?.[clave]; if (!p) return null;
  const f = t.familias[p.familia];
  const leer = (n: string) => { const r = path.join(raiz, 'marcas', 'logos', n); return fs.existsSync(r) ? fs.readFileSync(r, 'utf8').replace(/^<\?xml[^>]*>\s*/, '') : ''; };
  return { familia: p.familia, familiaNombre: f.nombre, marca: p.marca, subtitulo: p.subtitulo, alternativas: p.alternativas ?? [],
    promesa: p.promesa, voz: p.voz, dominio: p.dominio, acento: p.acento ?? f.colores.primario,
    colores: f.colores, tipografia: f.tipografia, personalidad: f.personalidad, motivo: f.motivo,
    logo: leer(`${clave}.svg`), icono: leer(`${clave}-icono.svg`) };
}

export function manifiesto(): { lineas: string[]; sello: string } | null {
  const ruta = path.join(raiz, 'marcas', 'tokens.json');
  if (!fs.existsSync(ruta)) return null;
  const t = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  return { lineas: t.manifiesto ?? [], sello: t.sello ?? '' };
}

export function proyecto(clave: string): Proyecto | undefined {
  return proyectos().find((p) => p.clave === clave);
}

/** El prompt de cada sesión vive en PROMPTS-SESIONES.md; se extrae por la carpeta `proyectos/<clave>`. */
export function promptDe(clave: string): string | null {
  const ruta = path.join(raiz, 'PROMPTS-SESIONES.md');
  if (!fs.existsSync(ruta)) return null;
  const md = fs.readFileSync(ruta, 'utf8');
  const marca = `proyectos/${clave}`;
  const i = md.indexOf(marca);
  if (i < 0) return null;
  const desde = md.indexOf('```', i);
  const hasta = md.indexOf('```', desde + 3);
  if (desde < 0 || hasta < 0) return null;
  return md.slice(desde + 3, hasta).trim();
}

export const documentos: Record<string, { titulo: string; archivo: string }> = {
  cartera: { titulo: 'Cartera', archivo: 'CARTERA.md' },
  viabilidad: { titulo: 'Viabilidad y costes', archivo: 'VIABILIDAD.md' },
  sesiones: { titulo: 'Reglas de las sesiones', archivo: 'SESIONES.md' },
  prompts: { titulo: 'Prompts de las sesiones', archivo: 'PROMPTS-SESIONES.md' },
  juicio: { titulo: 'Juicio y probabilidad', archivo: 'JUICIO.md' },
  marcas: { titulo: 'Marcas e identidad', archivo: 'MARCAS.md' },
  despliegues: { titulo: 'Despliegues y cuentas', archivo: 'DESPLIEGUES.md' },
  'producto-m': { titulo: 'Producto M: certificados de catalán', archivo: 'M-CATALA-PRODUCTE.md' },
};

export function documentoHtml(slug: string): { titulo: string; html: string } | null {
  const doc = documentos[slug];
  if (!doc) return null;
  const ruta = path.join(raiz, doc.archivo);
  if (!fs.existsSync(ruta)) return { titulo: doc.titulo, html: '<p>Este documento todavía no existe en el repositorio.</p>' };
  const md = fs.readFileSync(ruta, 'utf8');
  return { titulo: doc.titulo, html: marked.parse(md, { async: false }) as string };
}

export function ultimaAccion(p: Proyecto): Accion | undefined {
  return [...p.acciones].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
}

export const euros = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export const RAMA = 'claude/estrategia-ingresos-recurrentes-tx0rvw';
export const REPO = 'moisesmodu/vinclia-web';

export const fecha = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

/** Enlaces «de fuera»: URLs de producción o vistas previas, sin GitHub ni documentos internos. */
export function webs(p: Proyecto): { nombre: string; url: string; tipo: 'web' | 'vista previa' }[] {
  return Object.entries(p.enlaces)
    .filter(([, u]) => !u.includes('github.com'))
    .map(([nombre, url]) => ({ nombre, url, tipo: url.includes('claude.ai') ? 'vista previa' : 'web' }));
}
