import './game/canvas.js';
import './game/player.js';
import './game/entities.js';
import './game/planets.js';
import './network/socket.js';
import './ui/joystick.js';
import './ui/ui.js';
import { gameLoop } from './game/loop.js';

gameLoop();