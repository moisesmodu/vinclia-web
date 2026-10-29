import { Save } from '@comun/save';

/** Guardado del juego. Cambia la clave al copiar la plantilla (scripts/new-game.mjs lo hace solo). */
export const save = new Save('paint-grab.v1', {
  best: 0,
  coins: 0,
  runs: 0,
  tutorialDone: false,
  muted: false,
});
