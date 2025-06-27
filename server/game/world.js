// World state and entity management
const { WORLD_WIDTH, WORLD_HEIGHT, NUM_ENTITIES } = require('../config');
const EntityModule = require('./entities');
const { getPlanets } = require('./planets');
const { createInitialResources, updateResources } = require('./resources');

class WorldManager {
  constructor() {
    this.entities = Array.from({ length: NUM_ENTITIES }, EntityModule.createEntity);
    this.resources = createInitialResources(50);
  }

  getWorldSize() {
    return { width: WORLD_WIDTH, height: WORLD_HEIGHT };
  }

  getEntities() {
    return [...this.entities];
  }

  getResources() {
    return this.resources.filter(r => r.isActive);
  }

  getPlanets() {
    return getPlanets();
  }

  updateEntities(players) {
    EntityModule.updateEntities(this.entities, players);
    updateResources(this.resources, this.entities, players);
  }
}

module.exports = { WorldManager };