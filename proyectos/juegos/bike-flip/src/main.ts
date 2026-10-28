import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Levels } from './scenes/Levels';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

startGame({
  background: '#ffc390',
  scenes: [Boot, Menu, Levels, Play, Hud],
  physics: {
    default: 'matter',
    matter: { autoUpdate: false, gravity: { x: 0, y: 0.8 }, positionIterations: 8, velocityIterations: 6, debug: false },
  },
});
