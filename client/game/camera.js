// Camera management
import { getViewportSize } from '../utils/canvas.js';
import { clamp } from '../utils/math.js';
import { WORLD_WIDTH, WORLD_HEIGHT, worldSizeReceived } from '../config.js';

const Camera = {
  x: 0,
  y: 0,
  viewport: getViewportSize(),

  update(playerX, playerY) {
    Camera.x = playerX - Camera.viewport.width / 2;
    Camera.y = playerY - Camera.viewport.height / 2;

    // Only clamp camera to world boundaries if world size has been received from server
    if (worldSizeReceived) {
      Camera.x = clamp(Camera.x, 0, WORLD_WIDTH - Camera.viewport.width);
      Camera.y = clamp(Camera.y, 0, WORLD_HEIGHT - Camera.viewport.height);
    }
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