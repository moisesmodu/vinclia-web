/**
 * Adaptador de portal: una sola interfaz para CrazyGames (SDK v3), Poki (SDK v2), itch.io y web propia.
 * El portal se elige al compilar con VITE_PORTAL=crazygames|poki|itch|web (ver scripts/build.mjs).
 * Los SDK se cargan desde la URL oficial del portal en tiempo de ejecución (ambos portales lo exigen así).
 */

export type PortalName = 'crazygames' | 'poki' | 'itch' | 'web';

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

export function createPortal(): Portal {
  const name = (import.meta.env.VITE_PORTAL || 'web') as PortalName;
  if (name === 'crazygames') return new CrazyPortal();
  if (name === 'poki') return new PokiPortal();
  return new LocalPortal(name);
}

export const portal: Portal = createPortal();
