import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Levels } from './scenes/Levels';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

// No physics engine: Pin Rescue has its own small falling-sand simulation (src/sim.ts).
startGame({
  background: '#3a3f5c',
  scenes: [Boot, Menu, Levels, Play, Hud],
});
