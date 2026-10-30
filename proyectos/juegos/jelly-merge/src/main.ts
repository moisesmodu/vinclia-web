import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Sky } from './scenes/Sky';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

startGame({
  background: '#6cc8ff',
  // Sky before Play: it is drawn behind (gradient, clouds, hills; no zoom)
  scenes: [Boot, Menu, Sky, Play, Hud],
  physics: {
    default: 'matter',
    // stepped by Play with a fixed-step accumulator on real time (game.loop.rawDelta)
    // sleeping: settled jellies cost nothing; Play wakes the ones above every merge so nothing is left floating
    matter: { autoUpdate: false, enableSleeping: true, gravity: { x: 0, y: 1.7 }, positionIterations: 5, velocityIterations: 3, debug: false },
  },
});
