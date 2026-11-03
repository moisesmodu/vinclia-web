import { cache } from 'react';
import { EQUIPO_VERCEL, intentar, memorizar, type Resultado } from './comun';

// Webs con Web Analytics activado en Vercel.
export const WEBS_ANALYTICS: { nombre: string; vercel: string; web: string }[] = [
  { nombre: 'CCSE Fácil', vercel: 'ccse-en-tu-idioma', web: 'https://ccsefacil.com' },
  { nombre: 'Tus Papeles', vercel: 'nuevo-en-espana', web: 'https://tuspapeles.app' },
  { nombre: 'Oposita', vercel: 'placa-oposicions', web: 'https://oposita.digital' },
  { nombre: 'Lunilla', vercel: 'lunilla', web: 'https://lunilla.cat' },
  { nombre: 'Aprova', vercel: 'aprova-catala', web: 'https://aprova-catala.vercel.app' },
  { nombre: 'Nuvolet Games', vercel: 'juegos-casuales', web: 'https://juegos-casuales.vercel.app' },
  { nombre: 'NetoClaro', vercel: 'netoclaro', web: 'https://netoclaro.app' },
  { nombre: 'ImpuestoClaro', vercel: 'impuestoclaro', web: 'https://impuestoclaro.es' },
  { nombre: 'Numi Mates (app, pro, ment y tech)', vercel: 'mates-numi', web: 'https://app.numimates.com' },
  { nombre: 'Numi Mates (web)', vercel: 'numimates-web', web: 'https://numimates.com' },
];

export const enlaceAnalytics = (vercel: string) => `https://vercel.com/${EQUIPO_VERCEL}/${vercel}/analytics`;

type Cuenta = { visitantes: number; paginas: number };
export type Visitas = { nombre: string; vercel: string; web: string; d7: Resultado<Cuenta>; d30: Resultado<Cuenta> };

async function contar(proyecto: string, dias: number): Promise<Cuenta> {
  const token = process.env.VERCEL_TOKEN_PANEL;
  const equipo = process.env.PANEL_TEAM_ID;
  if (!token || !equipo) throw new Error('Faltan VERCEL_TOKEN_PANEL o PANEL_TEAM_ID');
  const q = new URLSearchParams({ projectId: proyecto, teamId: equipo, since: new Date(Date.now() - (dias - 1) * 864e5).toISOString(), until: new Date(Date.now() + 864e5).toISOString() });
  // La API redondea a días (UTC): `until` mañana incluye hoy; `since` hace dias-1 da `dias` días naturales.
  const r = await fetch(`https://api.vercel.com/v1/query/web-analytics/visits/count?${q}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Web Analytics ${r.status}: ${j?.error?.message ?? ''}`);
  return { visitantes: j.data?.visitors ?? 0, paginas: j.data?.pageviews ?? 0 };
}

export const visitas = cache(async (): Promise<Visitas[]> =>
  Promise.all(
    WEBS_ANALYTICS.map(async (w) => ({
      ...w,
      d7: await intentar(() => memorizar(`va7:${w.vercel}`, () => contar(w.vercel, 7), 300_000)),
      d30: await intentar(() => memorizar(`va30:${w.vercel}`, () => contar(w.vercel, 30), 300_000)),
    })),
  ),
);
