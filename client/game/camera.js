// Camera management
import { getViewportSize } from '../utils/canvas.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.viewport = getViewportSize();
  }

  update(playerX, playerY) {
    this.x = playerX - this.viewport.width / 2;
    this.y = playerY - this.viewport.height / 2;
  }

  getViewport() {
    return this.viewport;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x,
      y: worldY - this.y
    };
  }

  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x,
      y: screenY + this.y
    };
  }
}

export const camera = new Camera();