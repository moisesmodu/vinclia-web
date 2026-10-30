import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

// Sin motor de física: la pelota, el aro y el tablero se resuelven a mano en Play (paso fijo de 120 Hz).
startGame({
  background: '#fff1d6',
  scenes: [Boot, Menu, Play, Hud],
});
