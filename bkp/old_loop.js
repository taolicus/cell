// Simplified game loop
import { update } from './update.js';
import { render } from './render.js';

export function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}
