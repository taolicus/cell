// World state and entity management
const { WORLD_WIDTH, WORLD_HEIGHT, NUM_ENTITIES } = require('../config');
const { createEntity, updateEntities } = require('./entities');

class WorldManager {
  constructor() {
    this.entities = Array.from({ length: NUM_ENTITIES }, createEntity);
  }

  getWorldSize() {
    return { width: WORLD_WIDTH, height: WORLD_HEIGHT };
  }

  getEntities() {
    return [...this.entities];
  }

  updateEntities(players) {
    updateEntities(this.entities, players);
  }
}

module.exports = { WorldManager };