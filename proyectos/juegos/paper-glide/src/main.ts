import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

// Sin motor de física de Phaser: el planeo es un modelo propio y puro (src/vuelo.ts) con pasos fijos de 1/60 s.
startGame({
  background: '#7fd3ff',
  scenes: [Boot, Menu, Play, Hud],
});
