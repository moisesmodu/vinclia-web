'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { limpiarError } from '@/lib/control/comun';
import { contenido } from '@/lib/mando/contenido';
import { enviarPorResend, modoCorreo } from '@/lib/mando/correo';
import { q, registrar } from '@/lib/mando/db';

// Acciones del panel. Todo el panel está detrás de Vercel Authentication; además se comprueba que la petición
// venga del propio panel (Origin = Host) y solo se aceptan identificadores que existen en el contenido del build.

async function comprobarOrigen() {
  const h = await headers();
  const origen = h.get('origin');
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!origen || !host) throw new Error('Petición sin origen');
  let o: URL;
  try { o = new URL(origen); } catch { throw new Error('Origen no válido'); }
  if (o.host !== host) throw new Error('Origen no permitido');
}

export type Respuesta = { ok: boolean; mensaje: string };

const TAREAS = new Set(contenido.tareas.map((t) => t.id));
const PIEZAS = new Set(contenido.piezas.map((p) => p.id));

export async function marcarTarea(id: string, hecho: boolean): Promise<Respuesta> {
  try {
    await comprobarOrigen();
    if (typeof id !== 'string' || !TAREAS.has(id) || typeof hecho !== 'boolean') return { ok: false, mensaje: 'Tarea desconocida' };
    await q(`insert into tareas_estado (id, hecho, actualizado) values ($1, $2, now())
             on conflict (id) do update set hecho = excluded.hecho, actualizado = now()`, [id, hecho]);
    const t = contenido.tareas.find((x) => x.id === id)!;
    await registrar(hecho ? 'tarea hecha' : 'tarea reabierta', { id, titulo: t.titulo });
    revalidatePath('/', 'layout');
    return { ok: true, mensaje: hecho ? 'Hecha' : 'Pendiente otra vez' };
  } catch (e) {
    return { ok: false, mensaje: limpiarError(e) };
  }
}

export async function marcarPieza(id: string, publicado: boolean): Promise<Respuesta> {
  try {
    await comprobarOrigen();
    if (typeof id !== 'string' || !PIEZAS.has(id) || typeof publicado !== 'boolean') return { ok: false, mensaje: 'Pieza desconocida' };
    await q(`insert into piezas_estado (id, publicado, actualizado) values ($1, $2, now())
             on conflict (id) do update set publicado = excluded.publicado, actualizado = now()`, [id, publicado]);
    await registrar(publicado ? 'pieza publicada' : 'pieza sin publicar', { id });
    revalidatePath('/marketing');
    return { ok: true, mensaje: publicado ? 'Publicada' : 'Sin publicar' };
  } catch (e) {
    return { ok: false, mensaje: limpiarError(e) };
  }
}

export type ResultadoCorreo = { clave: string; para: string; estado: 'enviado' | 'simulado' | 'ya enviado' | 'error'; detalle: string };

async function enviarUno(clave: string): Promise<ResultadoCorreo> {
  const c = contenido.correos.find((x) => x.clave === clave);
  if (!c) return { clave, para: '', estado: 'error', detalle: 'Correo desconocido' };
  // Reserva atómica: solo pasa si nunca se envió (o si el intento anterior falló o fue una simulación).
  const reservado = await q(
    `insert into correos_envios (clave, pieza, para, estado) values ($1, $2, $3, 'enviando')
     on conflict (clave) do update set estado = 'enviando', error = null, actualizado = now()
       where correos_envios.estado in ('error', 'simulado')
     returning clave`, [c.clave, c.pieza, c.para]);
  if (reservado.length === 0) return { clave, para: c.para, estado: 'ya enviado', detalle: 'Ya se había enviado; no se repite' };
  const r = await enviarPorResend(c);
  if (r.ok) {
    const estado = r.simulado ? 'simulado' : 'enviado';
    await q(`update correos_envios set estado = $2, resend_id = $3, actualizado = now() where clave = $1`, [c.clave, estado, r.id]);
    await registrar(r.simulado ? 'correo simulado' : 'correo enviado', { pieza: c.pieza, para: c.para, asunto: c.asunto, resend: r.id });
    return { clave, para: c.para, estado, detalle: r.simulado ? 'Simulación: no ha salido ningún correo' : `Enviado (${r.id})` };
  }
  await q(`update correos_envios set estado = 'error', error = $2, actualizado = now() where clave = $1`, [c.clave, r.error]);
  await registrar('correo con error', { pieza: c.pieza, para: c.para, error: r.error });
  return { clave, para: c.para, estado: 'error', detalle: r.error };
}

export async function enviarCorreos(claves: string[]): Promise<{ ok: boolean; mensaje: string; modo: 'real' | 'simulacion'; resultados: ResultadoCorreo[] }> {
  const modo = modoCorreo();
  try {
    await comprobarOrigen();
    if (!Array.isArray(claves) || claves.length === 0 || claves.length > 50) return { ok: false, mensaje: 'Nada que enviar', modo, resultados: [] };
    const unicas = [...new Set(claves.filter((c) => typeof c === 'string'))];
    const resultados: ResultadoCorreo[] = [];
    for (const [i, clave] of unicas.entries()) {
      if (i > 0) await new Promise((r) => setTimeout(r, 600)); // Resend admite 2 por segundo.
      resultados.push(await enviarUno(clave));
    }
    revalidatePath('/marketing');
    const enviados = resultados.filter((r) => r.estado === 'enviado' || r.estado === 'simulado').length;
    return { ok: resultados.every((r) => r.estado !== 'error'), mensaje: `${enviados} de ${resultados.length} ${modo === 'simulacion' ? 'simulados' : 'enviados'}`, modo, resultados };
  } catch (e) {
    return { ok: false, mensaje: limpiarError(e), modo, resultados: [] };
  }
}
