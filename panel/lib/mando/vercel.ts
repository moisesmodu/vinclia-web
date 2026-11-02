import 'server-only';
import { cache } from 'react';
import { intentar, memorizar, type Resultado } from '@/lib/control/comun';
import { WEBS } from './entidades';

// Lecturas de la API de Vercel (solo GET y consultas de observabilidad, que no cambian nada).
function credenciales() {
  const token = process.env.VERCEL_TOKEN_PANEL;
  const equipo = process.env.PANEL_TEAM_ID;
  if (!token || !equipo) throw new Error('Faltan VERCEL_TOKEN_PANEL o PANEL_TEAM_ID');
  return { token, equipo };
}

async function api(ruta: string, params: Record<string, string>, init?: { method: 'POST'; body: unknown }) {
  const { token, equipo } = credenciales();
  const q = new URLSearchParams({ ...params, teamId: equipo });
  const r = await fetch(`https://api.vercel.com${ruta}?${q}`, {
    method: init?.method ?? 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(init ? { 'Content-Type': 'application/json' } : {}) },
    body: init ? JSON.stringify(init.body) : undefined,
    cache: 'no-store', signal: AbortSignal.timeout(12_000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Vercel ${ruta} ${r.status}: ${j?.error?.message ?? ''}`);
  return j;
}

export type Dia = { dia: string; visitantes: number; paginas: number };

/** Visitantes y páginas vistas por día (UTC) de los últimos `dias` días de una web. */
async function visitasPorDia(vercel: string, dias: number): Promise<Dia[]> {
  const desde = new Date(Date.now() - (dias - 1) * 864e5);
  const j = await api('/v1/query/web-analytics/visits/aggregate', {
    projectId: vercel, by: 'day', limit: '100',
    since: desde.toISOString().slice(0, 10) + 'T00:00:00Z', until: new Date(Date.now() + 864e5).toISOString().slice(0, 10) + 'T00:00:00Z',
  });
  return (j.data ?? []).map((d: any) => ({ dia: String(d.timestamp).slice(0, 10), visitantes: d.visitors ?? 0, paginas: d.pageviews ?? 0 }));
}

export const visitasDiarias = cache(async (): Promise<{ vercel: string; r: Resultado<Dia[]> }[]> =>
  Promise.all(WEBS.map(async (w) => ({ vercel: w.vercel, r: await intentar(() => memorizar(`vd:${w.vercel}`, () => visitasPorDia(w.vercel, 44), 600_000)) }))),
);

export type Despliegue = { estado: string; creado: Date; mensaje: string; url: string; inspector: string | null };

async function ultimoDespliegue(vercel: string): Promise<Despliegue | null> {
  const j = await api('/v6/deployments', { projectId: vercel, target: 'production', limit: '1' });
  const d = j.deployments?.[0];
  if (!d) return null;
  return { estado: d.readyState ?? d.state, creado: new Date(d.created), mensaje: (d.meta?.gitCommitMessage ?? '').split('\n')[0].slice(0, 140), url: `https://${d.url}`, inspector: d.inspectorUrl ?? null };
}

export const despliegues = cache(async () =>
  Promise.all(WEBS.map(async (w) => ({ vercel: w.vercel, r: await intentar(() => memorizar(`dep:${w.vercel}`, () => ultimoDespliegue(w.vercel), 120_000)) }))),
);

/** Respuestas 5xx de producción en las últimas 24 h, por proyecto (observabilidad de Vercel). */
async function errores24h(): Promise<Record<string, number>> {
  const { equipo } = credenciales();
  const fin = new Date(); const inicio = new Date(fin.getTime() - 864e5);
  const j = await api('/v2/observability/query', {}, {
    method: 'POST',
    body: {
      scope: { type: 'owner', ownerId: equipo }, metric: 'vercel.request.count', aggregation: 'sum',
      startTime: inicio.toISOString(), endTime: fin.toISOString(), granularity: { hours: 24 },
      groupBy: ['project_name'], filter: "http_status ge 500 and environment eq 'production'", limit: 50,
    },
  });
  const salida: Record<string, number> = {};
  for (const f of j.summary ?? []) salida[f.project_name] = f.vercel_request_count_sum ?? 0;
  return salida;
}

export const errores = cache(() => intentar(() => memorizar('err24', errores24h, 120_000)));
