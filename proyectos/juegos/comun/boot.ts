import Phaser from 'phaser';
import { portal } from './portal';
import { audio } from './audio';

/**
 * Arranque común: inicia el SDK del portal, crea el juego a pantalla completa (se adapta a cualquier
 * proporción, de móvil vertical a monitor ancho) y quita la pantalla de carga HTML.
 */
export async function startGame(opts: {
  scenes: Phaser.Types.Scenes.SceneType[];
  background: string;
  physics?: Phaser.Types.Core.PhysicsConfig;
}) {
  await portal.init();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: opts.background,
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    render: { antialias: true, powerPreference: 'high-performance' },
    fps: { target: 60, min: 20 },
    input: { activePointers: 2 },
    disableContextMenu: true,
    physics: opts.physics,
    audio: { disableWebAudio: false },
    scene: opts.scenes,
  });
  (window as any).__game = game; // para las pruebas automáticas (scripts/perf.mjs)
  return game;
}

/** Llamar desde la escena de carga cuando todo está listo. */
export function bootDone(game: Phaser.Game, startMuted: boolean) {
  audio.attach(game, startMuted);
  portal.loadingDone();
  document.getElementById('loader')?.remove();
}
