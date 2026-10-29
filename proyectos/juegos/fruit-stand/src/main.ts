import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Play } from './scenes/Play';

startGame({
  background: '#6cc8ff',
  scenes: [Boot, Menu, Play],
  // Física arcade para el ejemplo. Para coches, cuerdas o apilar: 'matter' (ver egg-truck/src/main.ts).
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 2200 } } },
});
