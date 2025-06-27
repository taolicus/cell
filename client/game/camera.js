// Camera management
import { getViewportSize } from '../utils/canvas.js';

const camera = {
  x: 0,
  y: 0,
  viewport: getViewportSize(),

  update(playerX, playerY) {
    camera.x = playerX - camera.viewport.width / 2;
    camera.y = playerY - camera.viewport.height / 2;
  },

  getViewport() {
    return camera.viewport;
  },

  getPosition() {
    return { x: camera.x, y: camera.y };
  },

  worldToScreen(worldX, worldY) {
    return {
      x: worldX - camera.x,
      y: worldY - camera.y
    };
  },

  screenToWorld(screenX, screenY) {
    return {
      x: screenX + camera.x,
      y: screenY + camera.y
    };
  }
};

export { camera };