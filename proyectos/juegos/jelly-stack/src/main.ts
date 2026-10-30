import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Sky } from './scenes/Sky';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

// No physics engine: the jelly is a damped spring on scale (fake soft body), far cheaper than Matter on phones.
startGame({
  background: '#6cc8ff',
  scenes: [Boot, Menu, Sky, Play, Hud],
});
