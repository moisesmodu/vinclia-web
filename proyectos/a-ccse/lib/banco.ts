import 'server-only';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { LenguaExplicacion } from './config';

export type Traduccion = { texto?: string; opciones?: string[]; explicacion?: string; nota?: string };
const cache = new Map<string, Record<string, Traduccion>>();

/** Explicaciones y traducciones por lengua (content/i18n/<lengua>.json). Solo servidor: es el contenido de pago. */
export function traducciones(lengua: LenguaExplicacion): Record<string, Traduccion> {
  const c = cache.get(lengua);
  if (c) return c;
  const f = path.join(process.cwd(), 'content', 'i18n', `${lengua}.json`);
  const d = existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as Record<string, Traduccion>) : {};
  cache.set(lengua, d);
  return d;
}
