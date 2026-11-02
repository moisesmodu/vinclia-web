import 'server-only';
import { contenido, type Tarea } from './contenido';
import { tareasHechas } from './db';

export type TareaEstado = Tarea & { hecho: boolean; hechoEn: Date | null };

const PESO = { alta: 0, media: 1, baja: 2 } as const;

export async function tareasConEstado() {
  const { datos, aviso } = await tareasHechas();
  const lista: TareaEstado[] = contenido.tareas.map((t) => {
    const e = datos.get(t.id);
    return { ...t, hecho: !!e?.hecho, hechoEn: e?.hecho ? e.actualizado : null };
  }).sort((a, b) => PESO[a.prioridad] - PESO[b.prioridad] || a.orden - b.orden);
  return { lista, aviso };
}
