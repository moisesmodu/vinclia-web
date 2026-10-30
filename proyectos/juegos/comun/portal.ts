/**
 * Adaptador de portal: una sola interfaz para CrazyGames (SDK v3), Poki (SDK v2), GameDistribution, GameMonetize,
 * itch.io y web propia. El portal se elige al compilar con VITE_PORTAL (ver scripts/build.mjs); GameDistribution y
 * GameMonetize necesitan además el id del juego en su panel (VITE_PORTAL_GAME_ID, de juegos.json → ids.<portal>).
 * Los SDK se cargan desde la URL oficial del portal en tiempo de ejecución (ambos portales lo exigen así).
 */

export type PortalName = 'crazygames' | 'poki' | 'gamedistribution' | 'gamemonetize' | 'itch' | 'web';

export interface Portal {
  readonly name: PortalName;
  /** true si el portal puede servir anuncios con recompensa (para mostrar u ocultar el botón). */
  readonly hasRewarded: boolean;
  init(): Promise<void>;
  loadingDone(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  /** Anuncio intersticial en pausa natural. Resuelve siempre (haya anuncio o no). */
  commercialBreak(): Promise<void>;
  /** Anuncio con recompensa. Resuelve true solo si el jugador lo vio entero. */
  rewardedBreak(): Promise<boolean>;
  /** Momento de euforia (récord): CrazyGames lo usa para sus métricas. */
  happyTime(): void;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type AudioHook = (muted: boolean) => void;
let audioHook: AudioHook = () => {};
/** El juego registra aquí cómo silenciar su audio durante los anuncios. */
export function onAdAudio(fn: AudioHook) {
  audioHook = fn;
}

function loadScript(src: string, timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    const t = setTimeout(() => resolve(false), timeoutMs);
    s.src = src;
    s.async = true;
    s.onload = () => { clearTimeout(t); resolve(true); };
    s.onerror = () => { clearTimeout(t); resolve(false); };
    document.head.appendChild(s);
  });
}

const safeStorage = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* modo privado */ } },
};

/* ------------------------------------------------------------ itch.io y web propia */
class LocalPortal implements Portal {
  readonly hasRewarded = false;
  constructor(readonly name: PortalName) {}
  async init() {}
  loadingDone() {}
  gameplayStart() {}
  gameplayStop() {}
  async commercialBreak() {}
  async rewardedBreak() { return false; }
  happyTime() {}
  getItem(k: string) { return safeStorage.get(k); }
  setItem(k: string, v: string) { safeStorage.set(k, v); }
}

/* ------------------------------------------------------------ CrazyGames SDK v3 */
// https://docs.crazygames.com/sdk/intro/  (anuncios: ad.requestAd; guardado: data.getItem/setItem)
class CrazyPortal implements Portal {
  readonly name = 'crazygames' as const;
  private sdk: any = null;
  get hasRewarded() { return !!this.sdk; } // sin SDK (bloqueador de anuncios) no se ofrece revivir
  private playing = false;

  async init() {
    const ok = await loadScript('https://sdk.crazygames.com/crazygames-sdk-v3.js');
    const w = window as any;
    if (!ok || !w.CrazyGames?.SDK) return;
    try {
      await w.CrazyGames.SDK.init();
      this.sdk = w.CrazyGames.SDK;
      this.sdk.game.loadingStart?.();
    } catch { this.sdk = null; }
  }
  loadingDone() { try { this.sdk?.game.loadingStop?.(); } catch { /* */ } }
  gameplayStart() { if (this.playing) return; this.playing = true; try { this.sdk?.game.gameplayStart(); } catch { /* */ } }
  gameplayStop() { if (!this.playing) return; this.playing = false; try { this.sdk?.game.gameplayStop(); } catch { /* */ } }
  private request(type: 'midgame' | 'rewarded'): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.sdk) return resolve(false);
      try {
        this.sdk.ad.requestAd(type, {
          adStarted: () => audioHook(true),
          adFinished: () => { audioHook(false); resolve(true); },
          adError: () => { audioHook(false); resolve(false); },
        });
      } catch { audioHook(false); resolve(false); }
    });
  }
  async commercialBreak() { await this.request('midgame'); }
  rewardedBreak() { return this.request('rewarded'); }
  happyTime() { try { this.sdk?.game.happytime(); } catch { /* */ } }
  // data.* guarda en la cuenta del jugador si ha iniciado sesión en CrazyGames; si no, en local.
  getItem(k: string) { try { return this.sdk ? this.sdk.data.getItem(k) : safeStorage.get(k); } catch { return safeStorage.get(k); } }
  setItem(k: string, v: string) { try { this.sdk ? this.sdk.data.setItem(k, v) : safeStorage.set(k, v); } catch { safeStorage.set(k, v); } }
}

/* ------------------------------------------------------------ Poki SDK v2 */
// https://sdk.poki.com/html5  (Poki no ofrece guardado en la nube: localStorage)
class PokiPortal implements Portal {
  readonly name = 'poki' as const;
  private sdk: any = null;
  get hasRewarded() { return !!this.sdk; }
  private playing = false;

  async init() {
    const ok = await loadScript('https://game-cdn.poki.com/scripts/v2/poki-sdk.js');
    const w = window as any;
    if (!ok || !w.PokiSDK) return;
    try { await w.PokiSDK.init(); this.sdk = w.PokiSDK; } catch { /* con bloqueador de anuncios init falla, el juego sigue sin anuncios */ }
  }
  loadingDone() { try { this.sdk?.gameLoadingFinished(); } catch { /* */ } }
  gameplayStart() { if (this.playing) return; this.playing = true; try { this.sdk?.gameplayStart(); } catch { /* */ } }
  gameplayStop() { if (!this.playing) return; this.playing = false; try { this.sdk?.gameplayStop(); } catch { /* */ } }
  async commercialBreak() {
    if (!this.sdk) return;
    try { await this.sdk.commercialBreak(() => audioHook(true)); } catch { /* */ }
    audioHook(false);
  }
  async rewardedBreak() {
    if (!this.sdk) return false;
    let ok = false;
    // Forma documentada: la función se llama si el anuncio va a mostrarse; la promesa dice si se vio entero.
    try { ok = !!(await this.sdk.rewardedBreak(() => audioHook(true))); } catch { ok = false; }
    audioHook(false);
    return ok;
  }
  happyTime() {}
  getItem(k: string) { return safeStorage.get(k); }
  setItem(k: string, v: string) { safeStorage.set(k, v); }
}

/* ------------------------------------------------------------ GameDistribution y GameMonetize */
// Mismo patrón en los dos: opciones globales con el id del juego, eventos SDK_GAME_PAUSE / SDK_GAME_START alrededor
// de cada anuncio y showAd() / showBanner(). GameDistribution: html5.api.gamedistribution.com (con recompensa);
// GameMonetize: api.gamemonetize.com/sdk.js (sin recompensa). Sin guardado en la nube: localStorage.
class EventAdsPortal implements Portal {
  private sdk: any = null;
  private resume: (() => void) | null = null;
  private rewardedOk = false;
  constructor(readonly name: 'gamedistribution' | 'gamemonetize') {}
  get hasRewarded() { return this.name === 'gamedistribution' && !!this.sdk; }

  async init() {
    const gameId = import.meta.env.VITE_PORTAL_GAME_ID || '';
    if (!gameId) return; // sin id del panel del portal no hay anuncios (el juego funciona igual)
    const w = window as any;
    const onEvent = (e: { name: string }) => {
      if (e.name === 'SDK_GAME_PAUSE') audioHook(true);
      if (e.name === 'SDK_GAME_START') { audioHook(false); const r = this.resume; this.resume = null; r?.(); }
      if (e.name === 'SDK_REWARDED_WATCH_COMPLETE') this.rewardedOk = true;
    };
    if (this.name === 'gamedistribution') {
      w.GD_OPTIONS = { gameId, onEvent };
      if (await loadScript('https://html5.api.gamedistribution.com/main.min.js')) this.sdk = w.gdsdk ?? null;
    } else {
      w.SDK_OPTIONS = { gameId, onEvent };
      if (await loadScript('https://api.gamemonetize.com/sdk.js')) this.sdk = w.sdk ?? null;
    }
  }
  loadingDone() {}
  gameplayStart() {}
  gameplayStop() {}
  /** Espera a SDK_GAME_START (fin del anuncio) con un tope, por si el portal no muestra nada. */
  private waitResume(maxMs: number) {
    return new Promise<void>((res) => { const t = setTimeout(() => { this.resume = null; audioHook(false); res(); }, maxMs); this.resume = () => { clearTimeout(t); res(); }; });
  }
  async commercialBreak() {
    if (!this.sdk) return;
    try {
      if (this.name === 'gamedistribution') { await this.sdk.showAd?.('interstitial'); }
      else { const w = this.waitResume(1500); this.sdk.showBanner?.(); await w; }
    } catch { /* sin anuncio */ }
    audioHook(false);
  }
  async rewardedBreak() {
    if (!this.hasRewarded) return false;
    this.rewardedOk = false;
    try { await this.sdk.showAd('rewarded'); } catch { return false; }
    audioHook(false);
    return this.rewardedOk;
  }
  happyTime() {}
  getItem(k: string) { return safeStorage.get(k); }
  setItem(k: string, v: string) { safeStorage.set(k, v); }
}

export function createPortal(): Portal {
  const name = (import.meta.env.VITE_PORTAL || 'web') as PortalName;
  if (name === 'crazygames') return new CrazyPortal();
  if (name === 'poki') return new PokiPortal();
  if (name === 'gamedistribution' || name === 'gamemonetize') return new EventAdsPortal(name);
  return new LocalPortal(name);
}

export const portal: Portal = createPortal();
