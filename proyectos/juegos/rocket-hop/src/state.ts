import { Save } from '@comun/save';

/** Todo lo que se guarda de Rocket Hop (en la cuenta de CrazyGames o en localStorage). */
export const save = new Save('rocket-hop.v1', {
  best: 0,           // mejor puntuación (plataformas + bonus de aterrizajes perfectos)
  perfects: 0,       // aterrizajes perfectos acumulados (la "moneda" del menú)
  runs: 0,
  tutorialDone: false,
  muted: false,
});
