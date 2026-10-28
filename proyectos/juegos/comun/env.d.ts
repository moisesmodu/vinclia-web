/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_PORTAL?: 'crazygames' | 'poki' | 'itch' | 'web' }
interface ImportMeta { readonly env: ImportMetaEnv }
