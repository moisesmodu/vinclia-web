import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Levels } from './scenes/Levels';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

// No physics engine: Rope Cut has its own small Verlet rope simulation (src/sim.ts).
startGame({
  background: '#4aa8ff',
  scenes: [Boot, Menu, Levels, Play, Hud],
});
