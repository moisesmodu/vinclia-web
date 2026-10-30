// Servidor de desarrollo con recarga: GAME=egg-truck npm run dev  (por defecto, egg-truck)
import { createServer } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const game = process.env.GAME || 'egg-truck';
const server = await createServer({ configFile: resolve(root, game, 'vite.config.ts'), server: { host: true } });
await server.listen();
server.printUrls();
