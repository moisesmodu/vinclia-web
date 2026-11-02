import 'server-only';
import { cache } from 'react';
import { memorizar } from '@/lib/control/comun';
import { WEBS, type Web } from './entidades';
import { despliegues, errores, type Despliegue } from './vercel';

export type Http = { ok: boolean; estado: number | null; ms: number | null; error?: string };

async function comprobar(url: string): Promise<Http> {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(8_000), headers: { 'User-Agent': 'PanelCartera/1.0 (+salud)' } });
    await r.body?.cancel().catch(() => {});
    return { ok: r.status < 400, estado: r.status, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, estado: null, ms: null, error: e instanceof Error && e.name === 'TimeoutError' ? 'sin respuesta en 8 s' : 'no conecta' };
  }
}

export type Nivel = 'bien' | 'atencion' | 'mal';
export type Salud = { web: Web; http: Http; despliegue: Despliegue | null; despliegueError: string | null; errores: number | null; nivel: Nivel; motivo: string };

export const salud = cache(async (): Promise<Salud[]> => {
  const [https, deps, errs] = await Promise.all([
    Promise.all(WEBS.map((w) => memorizar(`http:${w.web}`, () => comprobar(w.web), 60_000))),
    despliegues(),
    errores(),
  ]);
  return WEBS.map((web, i) => {
    const http = https[i];
    const d = deps.find((x) => x.vercel === web.vercel)!.r;
    const despliegue = d.ok ? d.datos : null;
    const n = errs.ok ? errs.datos[web.vercel] ?? 0 : null;
    let nivel: Nivel = 'bien'; let motivo = 'Todo en orden';
    if (!http.ok) { nivel = 'mal'; motivo = http.estado ? `La web responde ${http.estado}` : `La web ${http.error}`; }
    else if (despliegue?.estado === 'ERROR') { nivel = 'mal'; motivo = 'El último despliegue falló'; }
    else if (n && n > 0) { nivel = 'atencion'; motivo = `${n} error${n > 1 ? 'es' : ''} 5xx en 24 h`; }
    else if (despliegue && despliegue.estado !== 'READY') { nivel = 'atencion'; motivo = `Despliegue ${despliegue.estado.toLowerCase()}`; }
    else if (http.ms && http.ms > 2500) { nivel = 'atencion'; motivo = `Lenta: ${(http.ms / 1000).toFixed(1)} s`; }
    return { web, http, despliegue, despliegueError: d.ok ? null : d.error, errores: n, nivel, motivo };
  });
});
