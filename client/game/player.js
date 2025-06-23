// Player state and movement logic
import { getViewportSize } from './canvas.js';

export let WORLD_WIDTH = 6000;
export let WORLD_HEIGHT = 6000;

export const player = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  radius: 20,
  angle: 0, // in radians
  vx: 0,
  vy: 0,
  speed: 0, // current speed
  maxSpeed: 6,
  acceleration: 0.2,
  friction: 0.98, // liquid drag
  rotationSpeed: 0.06
};

export let camera = {
  x: player.x - getViewportSize().width / 2,
  y: player.y - getViewportSize().height / 2
};