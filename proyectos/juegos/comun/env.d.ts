/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_PORTAL?: 'crazygames' | 'poki' | 'gamedistribution' | 'gamemonetize' | 'itch' | 'web';
  readonly VITE_PORTAL_GAME_ID?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
