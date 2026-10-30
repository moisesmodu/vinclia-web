import { Save } from '@comun/save';
import { freshSave, type SaveData } from './sim';

/** Guardado de Tiny Harbor (cuenta de CrazyGames o localStorage). La partida va entera en 'game' (simulación). */
export const save = new Save('tiny-harbor.v1', {
  best: 0,            // monedas ganadas en total (trofeo del menú)
  stars: 0,           // estrellas: moneda de la tienda de cosméticos
  runs: 0,
  tutorialDone: false,
  muted: false,
  owned: [] as string[],
  equipped: {} as Record<string, string>,
  dailyDate: '',
  dailyStreak: 0,
  game: freshSave() as SaveData,
});

// para las pruebas automáticas (ganancias sin conexión, guardado)
(globalThis as any).__thSave = save;
