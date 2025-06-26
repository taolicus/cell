// Client-side configuration
export let WORLD_WIDTH = 1000; // Default, will be updated by server
export let WORLD_HEIGHT = 1000; // Default, will be updated by server

// Function to update world dimensions
export function updateWorldSize(width, height) {
  WORLD_WIDTH = width;
  WORLD_HEIGHT = height;
}