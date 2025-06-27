// Simplified game loop
import { update } from './update.js';
import { render } from './render.js';

export function Loop() {
  update();
  render();
  requestAnimationFrame(Loop);
}
