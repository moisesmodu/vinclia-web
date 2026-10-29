import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Levels } from './scenes/Levels';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

// No physics engine: Trick Floor has its own small tile platformer simulation (src/sim.ts).
startGame({
  background: '#f3e3ff',
  scenes: [Boot, Menu, Levels, Play, Hud],
});
