import 'server-only';
import { cache } from 'react';
import { memorizar } from '@/lib/control/comun';
import { contenido, type Juego } from './contenido';

// Estado público de cada juego en los portales, comprobado por HTTP (solo GET a páginas públicas).
export type Portal = 'itch' | 'gamedistribution' | 'gamemonetize' | 'crazygames' | 'poki';
export type EstadoPortal = 'publicado' | 'no publicado' | 'sin respuesta';
export type Celda = { estado: EstadoPortal; publica: string; ficha: string | null; prueba: string | null };

export const PORTALES: { clave: Portal; nombre: string; panel: string }[] = [
  { clave: 'itch', nombre: 'itch.io', panel: 'https://itch.io/dashboard' },
  { clave: 'gamedistribution', nombre: 'GameDistribution', panel: 'https://developer.gamedistribution.com/games' },
  { clave: 'gamemonetize', nombre: 'GameMonetize', panel: 'https://gamemonetize.com/account/games.php' },
  { clave: 'crazygames', nombre: 'CrazyGames', panel: 'https://developer.crazygames.com/' },
  { clave: 'poki', nombre: 'Poki', panel: 'https://developers.poki.com/' },
];

const slugPortal = (j: Juego, portal: string) => (j.nombrePortal?.[portal] ?? j.titulo).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Publicado = la página responde 200 y, si se indica, contiene una marca nuestra (id del juego o «Nuvolet»):
 *  así un juego de otro estudio con el mismo nombre no cuenta como nuestro. */
async function estadoUrl(url: string, marcas: string[] = []): Promise<EstadoPortal> {
  try {
    const r = await fetch(url, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(7_000), headers: { 'User-Agent': 'Mozilla/5.0 (PanelCartera; comprobación de estado)' } });
    if (r.status !== 200) { await r.body?.cancel().catch(() => {}); return 'no publicado'; }
    if (marcas.length === 0) { await r.body?.cancel().catch(() => {}); return 'publicado'; }
    const html = (await r.text()).toLowerCase();
    return marcas.some((m) => html.includes(m.toLowerCase())) ? 'publicado' : 'no publicado';
  } catch {
    return 'sin respuesta';
  }
}

async function comprobarJuego(j: Juego): Promise<Record<Portal, Celda>> {
  const gm = slugPortal(j, 'gamemonetize');
  const gd = slugPortal(j, 'gamedistribution');
  const urls = {
    itch: `https://nuvoletgames.itch.io/${j.slug}`,
    gamedistribution: `https://gamedistribution.com/games/${gd}/`,
    gamemonetize: `https://gamemonetize.com/${gm}-game`,
    crazygames: `https://www.crazygames.com/game/${j.slug}`,
    poki: `https://poki.com/en/g/${j.slug}`,
  };
  // GameMonetize redirige a la portada cuando el juego no existe (redirect manual = no publicado).
  const marcasGd = [j.ids?.gamedistribution, 'nuvolet'].filter(Boolean) as string[];
  const marcasGm = [j.ids?.gamemonetize, 'nuvolet'].filter(Boolean) as string[];
  const [itch, gdE, gmE, cg, pk] = await Promise.all([
    estadoUrl(urls.itch), estadoUrl(urls.gamedistribution, marcasGd), estadoUrl(urls.gamemonetize, marcasGm),
    estadoUrl(urls.crazygames, ['nuvolet']), estadoUrl(urls.poki, ['nuvolet']),
  ]);
  return {
    itch: { estado: itch, publica: urls.itch, ficha: 'https://itch.io/dashboard', prueba: null },
    gamedistribution: { estado: gdE, publica: urls.gamedistribution, ficha: j.idsInternos?.gamedistribution ? `https://developer.gamedistribution.com/games/${j.idsInternos.gamedistribution}/edit` : null, prueba: j.ids?.gamedistribution ? `https://html5.gamedistribution.com/${j.ids.gamedistribution}/` : null },
    gamemonetize: { estado: gmE, publica: urls.gamemonetize, ficha: j.idsInternos?.gamemonetize ? `https://gamemonetize.com/account/editgame.php?id=${j.idsInternos.gamemonetize}` : null, prueba: j.ids?.gamemonetize ? `https://html5.gamemonetize.co/${j.ids.gamemonetize}/` : null },
    crazygames: { estado: cg, publica: urls.crazygames, ficha: 'https://developer.crazygames.com/', prueba: null },
    poki: { estado: pk, publica: urls.poki, ficha: 'https://developers.poki.com/', prueba: null },
  };
}

/** Comprueba los 18 juegos de 6 en 6 y guarda el resultado 15 minutos. */
export const estadoJuegos = cache(() => memorizar('juegos', async () => {
  const salida: { juego: Juego; portales: Record<Portal, Celda> }[] = [];
  const lista = contenido.juegos;
  for (let i = 0; i < lista.length; i += 6) {
    const lote = await Promise.all(lista.slice(i, i + 6).map(async (juego) => ({ juego, portales: await comprobarJuego(juego) })));
    salida.push(...lote);
  }
  return { comprobado: new Date(), juegos: salida };
}, 900_000));
