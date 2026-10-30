import { startGame } from '@comun/boot';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Play } from './scenes/Play';
import { Hud } from './scenes/Hud';

startGame({ background: '#39b8e0', scenes: [Boot, Menu, Play, Hud] });
