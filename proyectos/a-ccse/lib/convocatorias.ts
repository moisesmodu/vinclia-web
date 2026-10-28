import { PAIS } from './config';
export type Convocatoria = { examen: string; cierre?: string; oficial: boolean };
export const CONVOCATORIAS = PAIS.convocatoria.fechas as Convocatoria[];
export function proximaConvocatoria(hoy = new Date()) {
  const h = hoy.toISOString().slice(0, 10);
  return CONVOCATORIAS.find((c) => c.examen >= h) ?? null;
}
export function futuras(hoy = new Date()) {
  const h = hoy.toISOString().slice(0, 10);
  return CONVOCATORIAS.filter((c) => c.examen >= h);
}
