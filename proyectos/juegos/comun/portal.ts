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
  /**
   * Pre-roll antes de la PRIMERA partida (solo GameDistribution y GameMonetize; en el resto no hace nada: Poki prohíbe
   * anuncios antes de la primera partida y CrazyGames tiene su propia lógica). Llamar de forma síncrona desde el gesto
   * del jugador en «jugar» (manejador de clic/toque/tecla) y esperar a la promesa antes de arrancar la partida.
   */
  prerollBreak(): Promise<void>;
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
type PauseHook = (paused: boolean) => void;
let pauseHook: PauseHook = () => {};
/** El arranque común registra aquí cómo pausar el bucle del juego (GameDistribution y GameMonetize lo piden). */
export function onAdPause(fn: PauseHook) {
  pauseHook = fn;
}

/** Inserta un <script> (con el id oficial del portal si lo pide) y resuelve true al cargar. */
function loadScript(src: string, timeoutMs = 6000, id?: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (id && document.getElementById(id)) return resolve(true);
    const s = document.createElement('script');
    const t = setTimeout(() => resolve(false), timeoutMs);
    if (id) s.id = id;
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
  async prerollBreak() {}
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
  async prerollBreak() {}
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
  async prerollBreak() {} // Poki prohíbe anuncios antes de la primera partida
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
// Guías oficiales: opciones globales (GD_OPTIONS / SDK_OPTIONS con gameId y onEvent) definidas ANTES de cargar el SDK
// con su id de script oficial; pre-roll antes de la primera partida y mid-roll en cada reinicio, lanzados por un gesto
// del jugador; audio y juego en pausa entre SDK_GAME_PAUSE y SDK_GAME_START (GD también avisa con
// CONTENT_RESUME_REQUESTED al acabar el anuncio). GameDistribution: html5.api.gamedistribution.com/main.min.js
// (con recompensa); GameMonetize: api.gamemonetize.com/sdk.js (sin recompensa). Sin guardado en la nube: localStorage.
const AD_MAX_MS = 30000; // tope de espera con anuncio en pantalla
const AD_NO_SHOW_MS = 8000; // si en este tiempo no llega SDK_GAME_PAUSE, no hay anuncio: se sigue jugando
class EventAdsPortal implements Portal {
  private sdk: any = null;
  private waiters: Array<() => void> = [];
  private adOn = false;
  private rewardedOk = false;
  private prerollDone = false;
  constructor(readonly name: 'gamedistribution' | 'gamemonetize') {}
  get hasRewarded() { return this.name === 'gamedistribution' && !!this.sdk; }

  private adStart() {
    if (this.adOn) return;
    this.adOn = true;
    audioHook(true);
    pauseHook(true);
  }
  private adEnd() {
    if (this.adOn) { this.adOn = false; audioHook(false); pauseHook(false); }
    const ws = this.waiters; this.waiters = [];
    ws.forEach((w) => w());
  }

  async init() {
    const gameId = import.meta.env.VITE_PORTAL_GAME_ID || '';
    if (!gameId) return; // sin id del panel del portal no hay anuncios (el juego funciona igual)
    const w = window as any;
    const onEvent = (e: { name: string }) => {
      switch (e?.name) {
        case 'SDK_GAME_PAUSE': case 'CONTENT_PAUSE_REQUESTED': this.adStart(); break;
        case 'SDK_GAME_START': case 'CONTENT_RESUME_REQUESTED': this.adEnd(); break;
        case 'SDK_REWARDED_WATCH_COMPLETE': this.rewardedOk = true; break;
      }
    };
    if (this.name === 'gamedistribution') {
      w.GD_OPTIONS = { gameId, onEvent };
      if (await loadScript('https://html5.api.gamedistribution.com/main.min.js', 8000, 'gamedistribution-jssdk')) this.sdk = w.gdsdk ?? null;
    } else {
      w.SDK_OPTIONS = { gameId, onEvent };
      if (await loadScript('https://api.gamemonetize.com/sdk.js', 8000, 'gamemonetize-sdk')) this.sdk = w.sdk ?? null;
    }
  }
  loadingDone() {}
  gameplayStart() {}
  gameplayStop() {}

  /**
   * Pide el anuncio (de forma síncrona, dentro del gesto del jugador) y espera a SDK_GAME_START /
   * CONTENT_RESUME_REQUESTED. Topes: 30 s con anuncio en pantalla; 8 s si el portal no llega a mostrar nada.
   */
  private adBreak(): Promise<void> {
    if (!this.sdk) return Promise.resolve();
    return new Promise<void>((res) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(tMax); clearTimeout(tNoShow);
        this.waiters = this.waiters.filter((x) => x !== finish);
        if (this.adOn) { this.adOn = false; audioHook(false); pauseHook(false); }
        res();
      };
      const tMax = setTimeout(finish, AD_MAX_MS);
      const tNoShow = setTimeout(() => { if (!this.adOn) finish(); }, AD_NO_SHOW_MS);
      this.waiters.push(finish);
      try {
        if (this.name === 'gamedistribution') {
          const p = this.sdk.showAd?.('interstitial');
          // showAd rechaza si no hay anuncio que servir: se sigue sin esperar
          p?.catch?.(() => { if (!this.adOn) finish(); });
        } else {
          this.sdk.showBanner?.();
        }
      } catch { finish(); }
    });
  }
  commercialBreak() { return this.adBreak(); }
  prerollBreak() {
    if (this.prerollDone) return Promise.resolve();
    this.prerollDone = true;
    return this.adBreak();
  }
  async rewardedBreak() {
    if (!this.hasRewarded) return false;
    this.rewardedOk = false;
    try { await this.sdk.showAd('rewarded'); } catch { this.adEnd(); return false; }
    this.adEnd();
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
