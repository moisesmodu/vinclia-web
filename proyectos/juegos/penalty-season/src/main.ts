import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Hub } from './scenes/Hub';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

startGame({
  background: '#7fd0ff',
  scenes: [Boot, Menu, Hub, Play, Hud],
});
