import { fileURLToPath } from 'node:url';
import { gameConfig } from '../comun/vite';

export default gameConfig(fileURLToPath(new URL('.', import.meta.url)));
