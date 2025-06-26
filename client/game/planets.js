// Planet logic and travel
import { WORLD_WIDTH, WORLD_HEIGHT } from './config.js';

// Planets will be received from server
export let planets = [];

// Function to update planets when received from server
export function updatePlanets(serverPlanets) {
  planets = serverPlanets;
}

// Function to regenerate planets when world size changes (for backward compatibility)
export function regeneratePlanets() {
  // Planets are now managed by server, so this function is deprecated
  console.log('Planets are now managed by server - regeneratePlanets() is deprecated');
}

// Additional travel logic and drawing functions to be added here as needed.