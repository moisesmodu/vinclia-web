import { defineConfig, type UserConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

/**
 * Configuración común de Vite para todos los juegos del catálogo.
 *  - base './': el zip funciona en cualquier subcarpeta (CrazyGames, Poki, itch.io).
 *  - OUT_DIR: carpeta de salida (la pone scripts/build.mjs por juego y portal).
 *  - SINGLEFILE=1: todo en un index.html (demo rápida y vista previa).
 */
export function gameConfig(gameDir: string): UserConfig {
  const single = process.env.SINGLEFILE === '1';
  return defineConfig({
    root: gameDir,
    base: './',
    publicDir: 'public',
    resolve: { alias: { '@comun': fileURLToPath(new URL('.', import.meta.url)) } },
    build: {
      outDir: process.env.OUT_DIR || 'dist',
      emptyOutDir: true,
      target: 'es2019',
      chunkSizeWarningLimit: 2000,
      assetsInlineLimit: single ? 100_000_000 : 4096,
      reportCompressedSize: false,
    },
    plugins: single ? [viteSingleFile()] : [],
  }) as UserConfig;
}
