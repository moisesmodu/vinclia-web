import 'server-only';
import pg from 'pg';
import { limpiarError } from '@/lib/control/comun';

// Base de datos propia del panel (Neon «cartera-panel», variable PANEL_DB_URL). Guarda solo el estado del panel:
// tareas hechas, piezas publicadas, correos enviados y el registro de acciones. Nunca toca las bases de las apps.
let pool: pg.Pool | null = (globalThis as any).__panelPool ?? null;

function db(): pg.Pool {
  if (pool) return pool;
  const url = process.env.PANEL_DB_URL;
  if (!url) throw new Error('Falta la variable PANEL_DB_URL');
  const u = new URL(url);
  u.searchParams.delete('sslmode'); u.searchParams.delete('channel_binding');
  pool = new pg.Pool({ connectionString: u.toString(), ssl: { rejectUnauthorized: true }, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000, statement_timeout: 10_000 });
  pool.on('error', () => {});
  (globalThis as any).__panelPool = pool;
  return pool;
}

export async function q<T extends pg.QueryResultRow = any>(sql: string, valores: unknown[] = []): Promise<T[]> {
  return (await db().query<T>(sql, valores)).rows;
}

export const hayBase = () => !!process.env.PANEL_DB_URL;

/** Lecturas que nunca rompen la página: si la base falla, devuelve el valor por defecto y el aviso. */
export async function leerSeguro<T>(fn: () => Promise<T>, porDefecto: T): Promise<{ datos: T; aviso: string | null }> {
  try { return { datos: await fn(), aviso: null }; }
  catch (e) { console.error('[panel-db]', limpiarError(e)); return { datos: porDefecto, aviso: limpiarError(e) }; }
}

export const tareasHechas = () => leerSeguro(async () => new Map((await q<{ id: string; hecho: boolean; actualizado: Date }>('select id, hecho, actualizado from tareas_estado')).map((r) => [r.id, r])), new Map());
export const piezasPublicadas = () => leerSeguro(async () => new Map((await q<{ id: string; publicado: boolean; actualizado: Date }>('select id, publicado, actualizado from piezas_estado')).map((r) => [r.id, r])), new Map());
export type Envio = { clave: string; estado: 'enviando' | 'enviado' | 'error' | 'simulado'; resend_id: string | null; error: string | null; actualizado: Date };
export const envios = () => leerSeguro(async () => new Map((await q<Envio>('select clave, estado, resend_id, error, actualizado from correos_envios')).map((r) => [r.clave, r])), new Map<string, Envio>());
export const ultimasAcciones = (n = 12) => leerSeguro(() => q<{ en: Date; accion: string; detalle: any }>('select en, accion, detalle from registro order by en desc limit $1', [n]), []);

export async function registrar(accion: string, detalle: Record<string, unknown>) {
  await q('insert into registro (accion, detalle) values ($1, $2)', [accion, JSON.stringify(detalle)]);
}
