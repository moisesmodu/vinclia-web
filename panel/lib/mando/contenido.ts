import 'server-only';
import datos from '@/lib/generado/contenido.json';

// Contenido del repositorio empaquetado en el build (scripts/generar-contenido.mjs). Solo servidor.

export type Enlace = { url: string; texto: string; interno?: boolean };
export type Tarea = {
  id: string; origen: string; titulo: string; detalle: string; porque: string; minutos: number | null; tiempo: string;
  prioridad: 'alta' | 'media' | 'baja'; orden: number; enlaces: Enlace[]; ubicacion?: string | null;
};
export type Bloque = { etiqueta: string; texto: string };
export type Pieza = {
  id: string; clave: string; proyecto: string; titulo: string; semana: number; canal: string; idioma: string; dia: string;
  quien: string; enlace: string | null; estado: string; bloques: Bloque[]; fuente: string;
};
export type FilaCalendario = { dia: string; fecha: string | null; texto: string; ids: string[]; proyecto: string; canal: string; estado: string; hito: boolean };
export type Semana = { numero: number; rango: string; lema: string; filas: FilaCalendario[] };
export type Correo = { clave: string; lote: string; id: string; pieza: string; para: string; de: string; responderA: string; asunto: string; texto: string };
export type Juego = { slug: string; titulo: string; estado?: string; ids: Record<string, string>; idsInternos: Record<string, number>; nombrePortal: Record<string, string> };
export type ProyectoRepo = {
  clave: string; letra: string; nombre: string; resumen: string; estado: string; modelo: string; orden: number;
  objetivoMes12: number; costesMes: number; paraMoises: string[]; proximos: string[]; acciones: { fecha: string; texto: string }[];
};

type Contenido = {
  generado: string; tareas: Tarea[]; piezas: Pieza[]; calendario: Semana[]; correos: Correo[];
  marcas: Record<string, { acento: string; svg: string }>; proyectos: ProyectoRepo[]; juegos: Juego[];
};

export const contenido = datos as unknown as Contenido;
