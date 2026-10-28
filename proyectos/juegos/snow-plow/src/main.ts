import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Sky } from './scenes/Sky';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

startGame({
  background: '#13235a',
  // Sky va antes que Play: se pinta detrás (cielo nocturno y estrellas, sin zoom)
  scenes: [Boot, Menu, Sky, Play, Hud],
  physics: {
    default: 'matter',
    matter: { autoUpdate: false, gravity: { x: 0, y: 1 }, positionIterations: 8, velocityIterations: 6, debug: false },
  },
});
