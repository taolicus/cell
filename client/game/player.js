// Player state and movement logic
import { camera } from './camera.js';
import { WORLD_WIDTH, WORLD_HEIGHT, updateWorldSize as updateConfigWorldSize } from './config.js';

export { WORLD_WIDTH, WORLD_HEIGHT };

export const player = {
  x: 0, // Will be set by server
  y: 0, // Will be set by server
  radius: 20,
  angle: 0, // Will be set by server
  vx: 0,
  vy: 0,
  speed: 0, // current speed
  maxSpeed: 6,
  acceleration: 0.2,
  friction: 0.98, // liquid drag
  rotationSpeed: 0.06
};

// Flag to track if server has provided position
let serverPositionReceived = false;

// Function to update world dimensions
export function updateWorldSize(width, height) {
  console.log('Updating world size from', WORLD_WIDTH, 'x', WORLD_HEIGHT, 'to', width, 'x', height);
  updateConfigWorldSize(width, height);
  // Only move to center if server hasn't provided a position yet
  if (!serverPositionReceived && player.x === 0 && player.y === 0) {
    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT / 2;
    camera.update(player.x, player.y);
  }
  console.log('World size updated successfully');
}

// Function to mark that server position has been received
export function setServerPositionReceived() {
  serverPositionReceived = true;
}