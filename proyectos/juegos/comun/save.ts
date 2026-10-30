import { portal } from './portal';

/**
 * Guardado tipado con valores por defecto. Va por el portal: en CrazyGames, a la cuenta del jugador
 * (data module); en el resto, a localStorage. Una clave por juego para no mezclar partidas del catálogo.
 */
export class Save<T extends Record<string, unknown>> {
  private data: T;
  constructor(private key: string, private defaults: T) {
    this.data = { ...defaults };
  }
  /** Llamar después de portal.init(): el SDK de CrazyGames tiene que estar listo para leer. */
  load() {
    try {
      const raw = portal.getItem(this.key);
      if (raw) this.data = { ...this.defaults, ...JSON.parse(raw) };
    } catch { this.data = { ...this.defaults }; }
    return this;
  }
  get<K extends keyof T>(k: K): T[K] { return this.data[k]; }
  set<K extends keyof T>(k: K, v: T[K]) {
    this.data[k] = v;
    portal.setItem(this.key, JSON.stringify(this.data));
  }
}
