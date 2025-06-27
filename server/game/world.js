// World state and entity management
const { WORLD_WIDTH, WORLD_HEIGHT, NUM_ENTITIES } = require('../config');
const Entities = require('./entities');
const Planets = require('./planets');
const Resources = require('./resources');

class WorldManager {
  constructor() {
    this.entities = Array.from({ length: NUM_ENTITIES }, Entities.createEntity);
    this.resources = Resources.createInitialResources(50);
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
    return Planets.getPlanets();
  }

  updateEntities(players) {
    Entities.updateEntities(this.entities, players);
    Resources.updateResources(this.resources, this.entities, players);
  }
}

module.exports = { WorldManager };