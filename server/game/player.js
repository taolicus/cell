// Player object factory for server
const {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PLAYER_RADIUS,
  PLAYER_MAX_ENERGY,
  PLAYER_ENERGY_CONSUMPTION_RATE
} = require('../config');

function createPlayer({ x, y, angle, energy } = {}) {
  return {
    x: x !== undefined ? x : WORLD_WIDTH / 2,
    y: y !== undefined ? y : WORLD_HEIGHT / 2,
    angle: angle !== undefined ? angle : 0,
    vx: 0,
    vy: 0,
    radius: PLAYER_RADIUS,
    // Energy system
    energy: energy !== undefined ? energy : PLAYER_MAX_ENERGY,
    maxEnergy: PLAYER_MAX_ENERGY,
    energyConsumptionRate: PLAYER_ENERGY_CONSUMPTION_RATE,
    isAlive: true
  };
}

module.exports = { createPlayer };