import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

// Sin motor de física: el pasillo pseudo-3D y los choques se calculan a mano en Play (más barato en móvil).
startGame({
  background: '#cfeaff',
  scenes: [Boot, Menu, Play, Hud],
});
