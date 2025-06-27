// Resource management for nutrient particles
const { WORLD_WIDTH, WORLD_HEIGHT } = require("../config");
const { distance } = require("../math");

const ResourceModule = {
  createResource() {
    return {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      radius: 8,
      energyValue: 30,
      isActive: true,
      respawnTime: 0,
    };
  },

  createInitialResources(count = 50) {
    const resources = [];
    for (let i = 0; i < count; i++) {
      resources.push(this.createResource());
    }
    return resources;
  },

  updateResources(resources, entities, players) {
    // Check for resource consumption by entities
    for (let i = resources.length - 1; i >= 0; i--) {
      const resource = resources[i];
      if (!resource.isActive) {
        resource.respawnTime--;
        if (resource.respawnTime <= 0) {
          resource.isActive = true;
          resource.x = Math.random() * WORLD_WIDTH;
          resource.y = Math.random() * WORLD_HEIGHT;
        }
        continue;
      }
      // Check if any entity is consuming this resource
      for (const entity of entities) {
        if (!entity.isAlive) continue;
        const dist = distance(resource.x, resource.y, entity.x, entity.y);
        if (dist < (resource.radius + entity.radius)) {
          // Entity consumes the resource
          entity.energy = Math.min(entity.energy + resource.energyValue, entity.maxEnergy);
          // Resource is consumed, start respawn timer
          resource.isActive = false;
          resource.respawnTime = 300 + Math.floor(Math.random() * 300); // 5-10 seconds at 60 FPS
          break; // Only one entity can consume a resource
        }
      }
      // Check if player is consuming this resource
      for (const playerId in players) {
        const player = players[playerId];
        if (!player.isAlive) continue;
        const dist = distance(resource.x, resource.y, player.x, player.y);
        if (dist < (resource.radius + player.radius)) {
          // Player consumes the resource
          player.energy = Math.min(player.energy + resource.energyValue, player.maxEnergy);
          // Resource is consumed, start respawn timer
          resource.isActive = false;
          resource.respawnTime = 300 + Math.floor(Math.random() * 300); // 5-10 seconds at 60 FPS
        }
      }
    }
    // Maintain minimum resource count
    const activeResources = resources.filter(r => r.isActive).length;
    const minResources = 30;
    if (activeResources < minResources) {
      const needed = minResources - activeResources;
      for (let i = 0; i < needed; i++) {
        resources.push(this.createResource());
      }
    }
  }
};

module.exports = ResourceModule;