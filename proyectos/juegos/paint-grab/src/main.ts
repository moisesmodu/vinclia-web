import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

// Sin motor de físicas: el patio es una rejilla (grid.ts) y la simulación es propia (sim.ts).
startGame({
  background: '#7fd36b',
  scenes: [Boot, Menu, Play, Hud],
});
