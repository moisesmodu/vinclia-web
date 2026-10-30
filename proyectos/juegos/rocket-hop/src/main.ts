import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

startGame({
  background: '#211a78',
  scenes: [Boot, Menu, Play, Hud],
  // Matter a paso fijo (Play.update hace world.step a 60 Hz con acumulador, como Egg Truck).
  physics: {
    default: 'matter',
    matter: { autoUpdate: false, gravity: { x: 0, y: 1 }, positionIterations: 8, velocityIterations: 6, debug: false },
  },
});
