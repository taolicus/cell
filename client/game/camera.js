// Camera management
import { getViewportSize } from '../utils/canvas.js';

const Camera = {
  x: 0,
  y: 0,
  viewport: getViewportSize(),

  update(playerX, playerY) {
    Camera.x = playerX - Camera.viewport.width / 2;
    Camera.y = playerY - Camera.viewport.height / 2;
  },

  getViewport() {
    return Camera.viewport;
  },

  getPosition() {
    return { x: Camera.x, y: Camera.y };
  },

  worldToScreen(worldX, worldY) {
    return {
      x: worldX - Camera.x,
      y: worldY - Camera.y
    };
  },

  screenToWorld(screenX, screenY) {
    return {
      x: screenX + Camera.x,
      y: screenY + Camera.y
    };
  }
};

export { Camera };