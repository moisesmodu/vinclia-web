import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

startGame({
  background: '#9be7ff',
  scenes: [Boot, Menu, Play, Hud],
  // Sin motor de física: la cuerda y el vuelo son unas pocas líneas propias a 60 Hz fijos (Play.step).
});
