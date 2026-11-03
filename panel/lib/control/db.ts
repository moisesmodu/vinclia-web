import pg from 'pg';
import { variableBase, type ClaveProyecto } from './comun';

// Un pool pequeño por base de datos, con el rol panel_ro (solo lectura) y el pooler de Neon.
// Se indexa por variable: dos proyectos que comparten base (Numi Mates y Numitech) comparten pool.
const pools: Map<string, pg.Pool> = ((globalThis as any).__controlPools ??= new Map());

function pool(clave: ClaveProyecto): pg.Pool {
  const variable = variableBase(clave);
  const existente = pools.get(variable);
  if (existente) return existente;
  const url = process.env[variable];
  if (!url) throw new Error(`Falta la variable ${variable}`);
  const u = new URL(url);
  u.searchParams.delete('sslmode');
  const p = new pg.Pool({
    connectionString: u.toString(),
    ssl: { rejectUnauthorized: true },
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    statement_timeout: 15_000,
  });
  p.on('error', () => {});
  pools.set(variable, p);
  return p;
}

/** Ejecuta consultas siempre dentro de una transacción READ ONLY. */
export async function leer<T>(clave: ClaveProyecto, fn: (q: <F extends pg.QueryResultRow = any>(sql: string, valores?: unknown[]) => Promise<F[]>) => Promise<T>): Promise<T> {
  const cliente = await pool(clave).connect();
  try {
    await cliente.query('BEGIN TRANSACTION READ ONLY');
    const q = async <F extends pg.QueryResultRow>(sql: string, valores?: unknown[]) => (await cliente.query<F>(sql, valores)).rows;
    const r = await fn(q);
    await cliente.query('COMMIT');
    return r;
  } catch (e) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    cliente.release();
  }
}
